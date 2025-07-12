import { Router } from "express";
import {
  getUser,
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateUserProfile,
  deleteUserAccount,
} from "../controllers/userController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();
router.get("/me", verifyToken, getUser);
router.put("/me", verifyToken, updateUserProfile);
router.delete("/me", verifyToken, deleteUserAccount);

// Employee routes
router.get("/employees", verifyToken, getEmployees);
router.post("/employees", verifyToken, createEmployee);
router.delete("/employees/:employeeId", verifyToken, deleteEmployee);

//employee booking routes

export default router;
