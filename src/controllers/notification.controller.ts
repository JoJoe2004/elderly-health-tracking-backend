import { Request, Response } from "express";
import { db } from "../config/db";

export const toggleNotify = async (req: Request, res: Response) => {
  const { id } = req.params;

  await db.query(
    "UPDATE medicine_times SET is_notify = IF(is_notify = 1, 0, 1) WHERE id = ?",
    [id]
  );

  res.json({ message: "updated" });
};

export const getNotificationsByElderly = async (req: Request, res: Response) => {
  const { elderlyId } = req.params;

  const [rows] = await db.query(`
    SELECT 
      mt.id,
      mt.time,
      mt.is_notify,
      mt.dose,
      mt.dose_type,
      mt.method,
      m.medicine_name,
      m.image,
      m.start_date,
      m.end_date
    FROM medicine_times mt
    JOIN medicines m ON mt.medicine_id = m.id
    WHERE m.elderly_id = ?
  `, [elderlyId]);

  res.json(rows);
};

