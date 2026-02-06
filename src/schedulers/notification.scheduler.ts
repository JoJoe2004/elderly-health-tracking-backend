import cron from "node-cron";
import { db } from "../config/db";
import { sendLineMedicineNotify } from "../services/line.service";

export const startMedicineScheduler = () => {
  const doseTypeMap: Record<string, string> = {
    tablet: "เม็ด",
    capsule: "แคปซูล",
    liquid: "มล.",
    spoon: "ช้อน",
  };

  const methodMap: Record<string, string> = {
    before: "ก่อนอาหาร",
    after: "หลังอาหาร",
    with_food: "พร้อมอาหาร",
    bedtime: "ก่อนนอน",
  };

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
      );
      const timeNow = now.toTimeString().slice(0, 5);
      const today = now.toISOString().slice(0, 10);

       const [rows]: any = await db.query(`
      SELECT 
        mt.*, 
        m.medicine_name, 
        m.image,
        e.title,
        e.first_name,
        e.last_name,
        e.line_user_id
      FROM medicine_times mt
      JOIN medicines m ON mt.medicine_id = m.id
      JOIN elderly e ON m.elderly_id = e.id
      WHERE
        (
          (mt.time = ? AND mt.notify_count = 0)

          OR

          (
            mt.notify_count IN (1, 2)
            AND TIMESTAMPDIFF(MINUTE, mt.sent_at, NOW()) BETWEEN 5 AND 6
          )
        )
        AND mt.is_notify = 1
        AND m.start_date <= ?
        AND (m.end_date IS NULL OR m.end_date >= ?)
        AND e.line_user_id IS NOT NULL
    `, [timeNow, today, today]);

      for (const row of rows) {

  // 1️⃣ lock ก่อน (สำคัญมาก)
  const [result]: any = await db.query(`
    UPDATE medicine_times
    SET notify_count = notify_count + 1,
        sent_at = NOW()
    WHERE id = ?
      AND notify_count = ?
  `, [row.id, row.notify_count]);


  // ถ้าไม่มี row ถูก update = มี instance อื่นส่งไปแล้ว
  if (result.affectedRows === 0) continue;


  // 2️⃣ ค่อย push หลัง lock สำเร็จ
  const timeHHMM = row.time.slice(0, 5)
  const elderlyName = `${row.title}${row.first_name} ${row.last_name}`;

  const message = `⏰ ถึงเวลาทานยาแล้ว
ผู้สูงอายุ : ${elderlyName}
ชื่อยา : ${row.medicine_name}
ปริมาณ : ${row.dose} ${doseTypeMap[row.dose_type] || ""}
วิธีทาน : ${methodMap[row.method] || row.method}
เวลา : ${timeHHMM} น.`;

  let imageUrl: string | null = null;

  if (row.image) {
    imageUrl = row.image.startsWith("http")
      ? row.image
      : `${process.env.API_URL}${row.image}`;
  }

  await sendLineMedicineNotify(row.line_user_id, message, row.id, imageUrl);
}
    } catch (err) {
      console.error(err);
    }
});

    cron.schedule("0 0 * * *", async () => {
        try {
          await db.query(`
            UPDATE medicine_times
            SET notify_count = 0,
                status='pending',
                sent_at=NULL,
                response_at=NULL
          `);
        } catch (err) {
          console.error("Daily reset error:", err);
        }
      },
      {
        timezone: "Asia/Bangkok",
      }
    )
};
