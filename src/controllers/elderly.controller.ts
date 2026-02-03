import { Request, Response } from "express";
import { db } from "../config/db";

// เพิ่มข้อมูลผู้สูงอายุ
export const addElderly = async (req: Request, res: Response) => {
  const { 
    userId, title, firstName, lastName, gender, age, birthDate, 
    phone, emergencyPhone, diseases = [], allergies = [] 
  } = req.body;

  const [result]: any = await db.query(
    `INSERT INTO elderly 
     (user_id, title, first_name, last_name, gender, age, birth_date, phone, emergency_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, firstName, lastName, gender, age, birthDate, phone, emergencyPhone]
  );

  const elderlyId = result.insertId;

  for (const d of diseases) {
    await db.query(
      "INSERT INTO elderly_diseases (elderly_id, disease_name) VALUES (?, ?)",
      [elderlyId, d]
    );
  }

  for (const a of allergies) {
    await db.query(
      "INSERT INTO elderly_allergies (elderly_id, allergy_name) VALUES (?, ?)",
      [elderlyId, a]
    );
  }

  res.json({ message: "เพิ่มข้อมูลผู้สูงอายุสำเร็จ" });
};


// อัปเดตข้อมูลผู้สูงอายุ
export const updateElderly = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, firstName, lastName, gender, age, birthDate, phone, emergencyPhone,
      diseases = [], allergies = []
    } = req.body;

    // update profile
    await db.query(
      `UPDATE elderly SET 
        title = ?, 
        first_name = ?, 
        last_name = ?, 
        gender = ?, 
        age = ?, 
        birth_date = ?, 
        phone = ?, 
        emergency_phone = ?
       WHERE id = ?`,
      [title, firstName, lastName, gender, age, birthDate, phone, emergencyPhone, id]
    );

    // ลบโรคเก่าทั้งหมด
    await db.query("DELETE FROM elderly_diseases WHERE elderly_id = ?", [id]);
    // ใส่ใหม่
    for (const d of diseases) {
      await db.query(
        "INSERT INTO elderly_diseases (elderly_id, disease_name) VALUES (?, ?)",
        [id, d]
      );
    }

    // ลบประวัติแพ้ยาเก่าทั้งหมด
    await db.query("DELETE FROM elderly_allergies WHERE elderly_id = ?", [id]);
    // ใส่ใหม่
    for (const a of allergies) {
      await db.query(
        "INSERT INTO elderly_allergies (elderly_id, allergy_name) VALUES (?, ?)",
        [id, a]
      );
    }

    res.json({ message: "อัปเดตข้อมูลผู้สูงอายุสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "อัปเดตข้อมูลไม่สำเร็จ" });
  }
};



//นับจำนวนผู้สูงอายุ
export const getElderlyCount = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  const [rows]: any = await db.query(
    "SELECT COUNT(*) as total FROM elderly WHERE user_id = ?",
    [userId]
  );

  res.json({ total: rows[0].total });
};

// ดึงรายชื่อผู้สูงอายุทั้งหมด
export const getElderlyList = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId; // หรือดึงจาก token ภายหลัง

    const [rows]: any = await db.query(
      "SELECT id, title, first_name, last_name, age, phone, status, line_user_id FROM elderly WHERE user_id = ?",
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ดึงข้อมูลผู้สูงอายุไม่สำเร็จ" });
  }
};

// ดึงข้อมูลผู้สูงอายุตาม ID
export const getElderlyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query(
      `SELECT 
        id, title, first_name, last_name, gender, age, DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date, phone, emergency_phone, status
       FROM elderly 
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้สูงอายุ" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ดึงข้อมูลผู้สูงอายุไม่สำเร็จ" });
  }
};

// อัปเดตสถานะผู้สูงอายุ
export const updateElderlyStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  await db.query(
    "UPDATE elderly SET status = ? WHERE id = ?",
    [status, id]
  );

  res.json({ message: "อัปเดตสถานะเรียบร้อย", status });
};

// ดึงโรคประจำตัวของผู้สูงอายุตาม ID
export const getElderlyDiseases = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [rows] = await db.query(
    "SELECT id, disease_name FROM elderly_diseases WHERE elderly_id = ?",
    [id]
  );
  res.json(rows);
};

// ดึงประวัติแพ้ยาของผู้สูงอายุตาม ID
export const getElderlyAllergies = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [rows] = await db.query(
    "SELECT id, allergy_name FROM elderly_allergies WHERE elderly_id = ?",
    [id]
  );
  res.json(rows);
};

// ลบผู้สูงอายุ
export const deleteElderly = async (req: Request, res: Response) => {
  console.log("DELETE ELDERLY:", req.params.id);

  try {
    await db.query("DELETE FROM elderly WHERE id = ?", [req.params.id]);
    res.json({ message: "ลบเรียบร้อย" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "ลบไม่สำเร็จ" });
  }
};

