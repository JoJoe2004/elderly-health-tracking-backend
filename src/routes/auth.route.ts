import { Router } from "express";
import { login, register, recovery, verifyOtp, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/recovery", recovery);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
