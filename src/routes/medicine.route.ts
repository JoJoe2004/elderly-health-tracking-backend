import express from "express";
import { addMedicines, deleteMedicineTime, getTodayNotifications, getElderlyByMedicineId, getMedicineById, getMedicineTableByElderly, updateMedicine } from "../controllers/medicine.controller";
import { uploadMedicine } from "../middleware/uploadMedicine";


const router = express.Router();

router.post("/medicines", uploadMedicine.array("images"), addMedicines);
router.put("/medicines/:id", uploadMedicine.single("image"), updateMedicine);

router.get("/elderly/:id/medicine-table", getMedicineTableByElderly);

router.get("/medicines/notifications/today/:userId", getTodayNotifications);

router.get("/medicines/:id/elderly", getElderlyByMedicineId);

router.get("/medicines/:id", getMedicineById);

router.delete("/medicine-times/:id", deleteMedicineTime);

export default router;
