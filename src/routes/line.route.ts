import { Router } from "express";
import { lineLogin, lineCallback, getLineStatus, unlinkLine, lineWebhook } from "../controllers/line.controller";

const router = Router();

router.get("/login", lineLogin);
router.get("/callback", lineCallback);
router.get("/users/:id/line-status", getLineStatus);
router.patch("/users/:id/unlink-line", unlinkLine);

router.post("/webhook", lineWebhook);

export default router;
