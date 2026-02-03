import { Router, Response } from "express";
import { uploadAvatar } from "../middleware/uploadAvatar"; // ✅ เปลี่ยนมาใช้ cloudinary
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { db } from "../config/db";

const router = Router();

/**
 * ===============================
 * GET /api/users/me
 * ===============================
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
 * ===============================
 * PUT /api/users/me
 * (Cloudinary version)
 * ===============================
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

    const file = req.file as any;

    /* ---------- check duplicate username ---------- */
    if (typeof username === "string") {
      const [dup] = await db.query<any[]>(
        `SELECT id FROM users WHERE username = ? AND id <> ?`,
        [username, userId]
      );

      if (dup.length > 0) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }
    }

    /* ---------- ⭐ Cloudinary URL ---------- */
    const newAvatarUrl = file ? file.path : null;

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

    res.json({
      username,
      avatarUrl: newAvatarUrl,
    });
  }
);

export default router;
