import { Router } from "express";
import {
  register,
  login,
  verify,
  logout,
  forgotPassword,
  verifyOtpLogin,
} from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.get("/verify", verifyToken, verify);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp-login", verifyOtpLogin);

export default router;
