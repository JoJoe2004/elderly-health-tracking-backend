import cron from "node-cron";
import { db } from "../config/db";

export const startHealthCleanupScheduler = () => {
  // ลบข้อมูลสุขภาพที่เก่ากว่า 30 วัน
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("🧹 auto delete health records older than 30 days");

      await db.query(`
        DELETE FROM health_records
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
    } catch (err) {
      console.error("Health cleanup error:", err);
    }
  });
};

