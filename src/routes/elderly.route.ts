import express from "express";
import { addElderly, 
        deleteElderly, 
        getElderlyAllergies, 
        getElderlyById, 
        getElderlyCount, 
        getElderlyDiseases, 
        getElderlyList,
        updateElderly, 
        updateElderlyStatus } from "../controllers/elderly.controller";

const router = express.Router();

router.post("/add", addElderly);
router.get("/count/:userId", getElderlyCount);
router.get("/", getElderlyList);
router.get("/:id", getElderlyById);
router.put("/:id", updateElderly);
router.put("/:id/status", updateElderlyStatus);
router.get("/:id/diseases", getElderlyDiseases);
router.get("/:id/allergies", getElderlyAllergies);
router.delete("/:id", deleteElderly);

export default router;
