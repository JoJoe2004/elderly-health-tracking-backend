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
      WHERE mt.time = ?
        AND mt.is_notify = 1
        AND m.start_date <= ?
        AND (m.end_date IS NULL OR m.end_date >= ?)
        AND e.line_user_id IS NOT NULL
    `, [timeNow, today, today]);



      for (const row of rows) {
        const timeHHMM = row.time.slice(0, 5)
        const elderlyName = `${row.title}${row.first_name} ${row.last_name}`;

        const message = `⏰ ถึงเวลาทานยาแล้ว
ผู้สูงอายุ : ${elderlyName}
ชื่อยา : ${row.medicine_name}
ปริมาณ : ${row.dose} ${doseTypeMap[row.dose_type] || ""}
วิธีทาน : ${methodMap[row.method] || row.method}
เวลา : ${timeHHMM}  น.`;

        let imageUrl: string | null = null;

        if (row.image) {
          const imagePath = row.image.startsWith("/")
            ? row.image.slice(1)
            : row.image;

          imageUrl = `https://syllogistically-painstaking-valarie.ngrok-free.dev/${imagePath}`;
        }
        await sendLineMedicineNotify(row.line_user_id, message, row.id, imageUrl);

        // หลังส่ง LINE สำเร็จ
        await db.query(`
          UPDATE medicine_times 
          SET status='waiting', sent_at=NOW()
          WHERE id=?
        `, [row.id]);
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });
  
   cron.schedule("*/5 * * * *", async () => {
          try {
            await db.query(`
              UPDATE medicine_times
              SET status = 'missed'
              WHERE status = 'waiting'
                AND sent_at IS NOT NULL
                AND TIMESTAMPDIFF(MINUTE, sent_at, NOW()) >= 30
            `);
          } catch (err) {
            console.error("Missed check error:", err);
    }});

    cron.schedule(
      "0 0 * * *",
      async () => {
        try {
          await db.query(`
            UPDATE medicine_times
            SET status='pending',
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
    );

};
