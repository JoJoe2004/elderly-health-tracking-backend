import { Request, Response } from "express";
import { db } from "../config/db";

/* =================================
   ADD MEDICINES (หลายรูป)
================================= */
export const addMedicines = async (req: Request, res: Response) => {
  try {
    const elderlyId = Number(req.body.elderlyId);
    const medicines = JSON.parse(req.body.data);

    // ⭐ Cloudinary files
    const files = req.files as Express.Multer.File[];

    let fileIndex = 0;

    for (const med of medicines) {
      // ✅ ใช้ file.path แทน filename
      const imageUrl = files[fileIndex] ? files[fileIndex].path : null;
      fileIndex++;

      const [result]: any = await db.query(
        `INSERT INTO medicines 
         (elderly_id, medicine_name, start_date, end_date, side_effect, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          elderlyId,
          med.name,
          med.startDate || null,
          med.endDate || null,
          med.sideEffect || null,
          imageUrl,
        ]
      );

      const medicineId = result.insertId;

      for (const t of med.schedules) {
        await db.query(
          `INSERT INTO medicine_times
          (medicine_id, dose, dose_type, time, method, is_notify, status)
          VALUES (?, ?, ?, ?, ?, 1, 'pending')`,
          [medicineId, t.dose, t.type, t.time, t.method]
        );
      }
    }

    res.json({ message: "บันทึกสำเร็จ" });
  } catch (err) {
    console.error("SAVE MEDICINE ERROR:", err);
    res.status(500).json({ message: "บันทึกไม่สำเร็จ" });
  }
};


/* =================================
   UPDATE MEDICINE (รูปเดียว)
================================= */
export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      medicine_name,
      start_date,
      end_date,
      side_effect,
      times,
      image: oldImage,
    } = JSON.parse(req.body.data);

    // ✅ Cloudinary
    const imageUrl = req.file ? req.file.path : oldImage;

    await db.query(
      `UPDATE medicines
       SET medicine_name=?, start_date=?, end_date=?, side_effect=?, image=?
       WHERE id=?`,
      [medicine_name, start_date, end_date, side_effect, imageUrl, id]
    );

    const keepIds: number[] = [];

    for (const t of times) {
      if (t.id) {
        await db.query(
          `UPDATE medicine_times
           SET dose=?, dose_type=?, time=?, method=?, is_notify=?
           WHERE id=?`,
          [t.dose, t.dose_type, t.time, t.method, t.is_notify ? 1 : 0, t.id]
        );
        keepIds.push(t.id);
      } else {
        const [result]: any = await db.query(
          `INSERT INTO medicine_times
          (medicine_id, dose, dose_type, time, method, is_notify, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [id, t.dose, t.dose_type, t.time, t.method, t.is_notify ? 1 : 0]
        );
        keepIds.push(result.insertId);
      }
    }

    if (keepIds.length > 0) {
      await db.query(
        `DELETE FROM medicine_times
         WHERE medicine_id=? AND id NOT IN (?)`,
        [id, keepIds]
      );
    }

    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "แก้ไขไม่สำเร็จ" });
  }
};

// ลบเวลาทานยา (ถ้าเป็นเวลาสุดท้ายให้ลบตัวยาด้วย)
export const deleteMedicineTime = async (req: Request, res: Response) => {
  const timeId = req.params.id;

  // หา medicine_id ของเวลานี้
  const [[row]]: any = await db.query(
    "SELECT medicine_id FROM medicine_times WHERE id = ?",
    [timeId]
  );

  const medicineId = row.medicine_id;

  // นับจำนวนเวลาทั้งหมดของยานี้
  const [[count]]: any = await db.query(
    "SELECT COUNT(*) as total FROM medicine_times WHERE medicine_id = ?",
    [medicineId]
  );

  if (count.total > 1) {
    // ลบแค่เวลา
    await db.query("DELETE FROM medicine_times WHERE id = ?", [timeId]);
  } else {
    // เป็นเวลาสุดท้าย → ลบตัวยาหลัก
    await db.query("DELETE FROM medicines WHERE id = ?", [medicineId]);
  }

  res.json({ message: "ลบเรียบร้อย" });
};

// ดึงรายการยาของผู้สูงอายุตาม id (สำหรับตารางยา)
export const getMedicineTableByElderly = async (req: Request, res: Response) => {
  try {
    const elderlyId = req.params.id;

    const [rows]: any = await db.query(
      `SELECT 
        mt.id AS time_id,
        m.id AS medicine_id,
        m.medicine_name,
        mt.dose,
        mt.dose_type,
        mt.time,
        mt.method,
        m.side_effect
      FROM medicines m
      JOIN medicine_times mt ON m.id = mt.medicine_id
      WHERE m.elderly_id = ?
      ORDER BY m.id, mt.time`,
      [elderlyId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงข้อมูลยาไม่สำเร็จ" });
  }
};


// ดึงข้อมูลผู้สูงอายุจาก medicine_id
export const getElderlyByMedicineId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await db.query(
      `
      SELECT e.id, e.title, e.first_name, e.last_name
      FROM medicines m
      JOIN elderly e ON m.elderly_id = e.id
      WHERE m.id = ?
      `,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้สูงอายุ" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("getElderlyByMedicineId error:", error);
    res.status(500).json({ message: "ดึงข้อมูลผู้สูงอายุล้มเหลว" });
  }
};


export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [medicineRows] = await db.query<any[]>(
      "SELECT * FROM medicines WHERE id = ?",
      [id]
    );

    if (!medicineRows || medicineRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลยา" });
    }

    const [timeRows] = await db.query<any[]>(
      "SELECT * FROM medicine_times WHERE medicine_id = ?",
      [id]
    );

    res.json({
      ...medicineRows[0],
      times: timeRows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};


export const getTodayNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(`
      SELECT 
        mt.id AS time_id,
        e.id AS elderly_id,
        CONCAT(e.title, e.first_name, ' ', e.last_name) AS elderly_name,
        m.medicine_name,
        mt.time,
        mt.status,
        mt.sent_at,
        mt.response_at
      FROM medicine_times mt
      JOIN medicines m ON mt.medicine_id = m.id
      JOIN elderly e ON m.elderly_id = e.id
      WHERE m.start_date <= CURDATE()
        AND (m.end_date IS NULL OR m.end_date >= CURDATE())
        AND mt.is_notify = 1
        AND e.user_id = ?
      ORDER BY mt.time ASC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ดึงแจ้งเตือนไม่สำเร็จ" });
  }
};
