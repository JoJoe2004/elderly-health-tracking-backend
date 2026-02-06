import { Request, Response } from "express";
import { db } from "../config/db";
import { sendOtpEmail } from "../utils/mailer";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Login Backend
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [rows]: any = await db.query(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login success",
    userId: user.id,
    token,
  });
};


// Register Backend
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ เช็กข้อมูลครบ
    if (!email || !password) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    // 2️⃣ เช็ก format email ก่อน (เร็วสุด ไม่แตะ DB)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    // 3️⃣ เช็ก email ซ้ำ
    const [rows]: any = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    // 4️⃣ hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5️⃣ insert
    await db.query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );

    res.status(201).json({ message: "Register สำเร็จ" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




// Request OTP
export const recovery = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const [rows]: any = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ message: "ไม่พบอีเมลนี้" });

    const userId = rows[0].id;

    // 🔥 ลบ OTP เก่าของ user นี้ทั้งหมด
    await db.query(
      "DELETE FROM otp_codes WHERE user_id = ?",
      [userId]
    );

    // สร้าง OTP ใหม่
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(
      `INSERT INTO otp_codes (user_id, otp_code, expires_at, is_used)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)`,
      [userId, otp]
    );

    await sendOtpEmail(email, otp);

    res.json({
      message: "ส่ง OTP แล้ว",
      userId
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



export const verifyOtp = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
  }

  const [rows]: any = await db.query(
    `SELECT * FROM otp_codes
     WHERE user_id = ?
     AND otp_code = ?
     AND is_used = 0
     AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, otp]
  );

  if (!rows.length) {
    return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });
  }

  await db.query(
    "UPDATE otp_codes SET is_used = 1 WHERE id = ?",
    [rows[0].id]
  );

  res.json({ message: "OTP ถูกต้อง" });
};



//Reset passwprd
export const resetPassword = async (req: Request, res: Response) => {
  const { userId, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  await db.query(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, userId]
  );

  res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
};