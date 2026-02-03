import express from "express";
import { toggleNotify, getNotificationsByElderly } from "../controllers/notification.controller";

const router = express.Router();

// ดึงรายการแจ้งเตือนตามผู้สูงอายุ
router.get("/notifications/:elderlyId", getNotificationsByElderly);

// เปิด/ปิด แจ้งเตือนรายเวลา
router.patch("/notifications/:id/toggle", toggleNotify);

export default router;
