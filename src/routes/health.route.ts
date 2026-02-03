import express from "express";
import {
  addHealthRecord,
  getHealthTableByElderly,
  getHealthRecordById,
  getHealthGraph,
  getElderliesByUser,
} from "../controllers/health.controller";

const router = express.Router();

router.post("/health-records", addHealthRecord);
router.get("/elderly/:id/health-records", getHealthTableByElderly);
router.get("/health-records/:id", getHealthRecordById);
router.get("/elderly/:elderlyId/health-graph", getHealthGraph);
router.get("/users/:userId/elderlies", getElderliesByUser);

export default router;
