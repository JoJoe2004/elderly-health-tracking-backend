import express from "express";
import { addMedicines, deleteMedicineTime, getTodayNotifications, getElderlyByMedicineId, getMedicineById, getMedicineTableByElderly, updateMedicine } from "../controllers/medicine.controller";
import { upload } from "../middleware/upload";


const router = express.Router();

router.post("/medicines", upload.array("images"), addMedicines);

router.get("/elderly/:id/medicine-table", getMedicineTableByElderly);

router.get("/medicines/:id/elderly", getElderlyByMedicineId);

router.get("/medicines/:id", getMedicineById);

router.put("/medicines/:id", upload.single("image"), updateMedicine);

router.delete("/medicine-times/:id", deleteMedicineTime);
  
router.get("/medicines/notifications/today/:userId", getTodayNotifications);

export default router;
