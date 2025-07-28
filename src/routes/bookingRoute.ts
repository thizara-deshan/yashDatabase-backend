import { Router } from "express";

import { verifyToken } from "../middleware/authMiddleware";
import {
  createBooking,
  getBookings,
  getBookingDetailsbyId,
  deleteCustomerBooking,
  updateCustomerBooking,
} from "../controllers/bookingController";

const router = Router();
//customer booking routes
router.post("/createbooking", verifyToken, createBooking);
router.get("/get-bookings", verifyToken, getBookings);
router.get("/:bookingId/details", verifyToken, getBookingDetailsbyId);
router.delete("/customer/:bookingId", verifyToken, deleteCustomerBooking);
router.put("/customer/:bookingId", verifyToken, updateCustomerBooking);

export default router;
