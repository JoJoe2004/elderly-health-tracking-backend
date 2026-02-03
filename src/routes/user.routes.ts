import { Router, Response } from "express";
import fs from "fs";
import { uploadAvatar } from "../upload/avatarUpload";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { db } from "../config/db";
import path from "path";

const router = Router();

/**
 * GET /api/users/me
 */
router.get(
  "/users/me",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const [rows] = await db.query<any[]>(
      `
      SELECT id, email, username, avatar_url
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatar_url,
    });
  }
);


/**
 * PUT /api/users/me
 */
router.put(
  "/users/me",
  authMiddleware,
  uploadAvatar.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    let username: string | null | undefined = undefined;

    if (typeof req.body.username === "string") {
      const trimmed = req.body.username.trim();
      username = trimmed === "" ? null : trimmed;
    }


    const file = req.file;

    // 1️⃣ check username duplicate
    if (typeof username === "string") {
      const [dup] = await db.query<any[]>(
        `
        SELECT id FROM users
        WHERE username = ? AND id <> ?
        `,
        [username, userId]
      );

      if (dup.length > 0) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }
    }

    // 2️⃣ get old avatar
    const [oldRows] = await db.query<any[]>(
      `SELECT avatar_url FROM users WHERE id = ?`,
      [userId]
    );

    const oldAvatar = oldRows.length > 0 ? oldRows[0].avatar_url : null;

    const newAvatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : null;

    // 3️⃣ update user
    await db.query(
      `
      UPDATE users
      SET
        username = ?,
        avatar_url = COALESCE(?, avatar_url),
        updated_at = NOW()
      WHERE id = ?
      `,
      [username, newAvatarUrl, userId]
    );

    // 4️⃣ delete old avatar
    if (file && oldAvatar) {
      fs.unlink(
        path.join(process.cwd(), oldAvatar),
        (err) => {
          if (err) {
            console.error("Failed to delete old avatar:", err.message);
          }
        }
      );
    }
    const finalAvatarUrl = newAvatarUrl ?? oldAvatar;

    res.json({
      username,
      avatarUrl: finalAvatarUrl,
    });
  }
);

export default router;
