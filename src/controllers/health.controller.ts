import { Request, Response } from "express";
import { db } from "../config/db";

/* เพิ่มบันทึก */
export const addHealthRecord = async (req: Request, res: Response) => {
  try {
    const {
      elderly_id,
      record_date,
      weight,
      blood_pressure, // "140/80"
      pulse,
      oxygen,
      temperature,
      blood_sugar,
      abnormal_symptom,
      note,
    } = req.body;

    // ✅ แยกความดัน
    let systolic: number | null = null;
    let diastolic: number | null = null;

    if (blood_pressure) {
      const match = blood_pressure.match(/^(\d{2,3})\/(\d{2,3})$/);
      if (!match) {
        return res.status(400).json({
          message: "รูปแบบความดันโลหิตไม่ถูกต้อง (เช่น 140/80)",
        });
      }

      systolic = Number(match[1]);
      diastolic = Number(match[2]);
    }

    await db.query(
      `
      INSERT INTO health_records
      (
        elderly_id,
        record_date,
        weight,
        systolic,
        diastolic,
        pulse,
        oxygen,
        temperature,
        blood_sugar,
        abnormal_symptom,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        elderly_id,
        record_date,
        weight,
        systolic || null,
        diastolic || null,
        pulse,
        oxygen || null,
        temperature || null,
        blood_sugar || null,
        abnormal_symptom || null,
        note || null,
      ]
    );

    
    res.json({ message: "บันทึกสุขภาพสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "บันทึกสุขภาพไม่สำเร็จ" });
  }
};


/* ตารางรายชื่อ */
export const getHealthTableByElderly = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query(
      `SELECT 
        h.id,
        h.record_date,
        CONCAT(e.title, e.first_name, ' ', e.last_name) AS full_name,
        TIMESTAMPDIFF(YEAR, e.birth_date, CURDATE()) AS age,
        h.weight,
        h.pulse,
        CONCAT(h.systolic, '/', h.diastolic) AS blood_pressure
       FROM health_records h
       JOIN elderly e ON h.elderly_id = e.id
       WHERE h.elderly_id = ?
       ORDER BY h.record_date DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "โหลดข้อมูลไม่สำเร็จ" });
  }
};



/* ดูรายละเอียด */
export const getHealthRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query(
      `SELECT 
        h.id,
        h.record_date,
        h.weight,
        h.pulse,
        h.oxygen,
        h.temperature,
        h.blood_sugar,
        h.abnormal_symptom,
        h.note,
        CONCAT(h.systolic, '/', h.diastolic) AS blood_pressure,
        CONCAT(e.title, e.first_name, ' ', e.last_name) AS elderly_name
       FROM health_records h
       JOIN elderly e ON h.elderly_id = e.id
       WHERE h.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ไม่พบข้อมูล" });
  }
};


export const getHealthGraph = async (req: Request, res: Response) => {
  const { elderlyId } = req.params;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        record_date,
        weight,
        systolic,
        diastolic,
        pulse,
        oxygen,
        temperature,
        blood_sugar,
        created_at
      FROM health_records
      WHERE elderly_id = ?
      ORDER BY record_date DESC
      LIMIT 7
      `,
      [elderlyId]
    );

    // เรียงวันที่จากเก่า -> ใหม่ สำหรับกราฟ
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงข้อมูลกราฟไม่สำเร็จ" });
  }
};



export const getElderliesByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        id,
        title,
        first_name,
        last_name
      FROM elderly
      WHERE user_id = ?
      ORDER BY id ASC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getElderliesByUser error:", err);
    res.status(500).json({ message: "โหลดรายชื่อผู้สูงอายุไม่สำเร็จ" });
  }
};
