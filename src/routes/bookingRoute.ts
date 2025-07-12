import { Router } from "express";

import { verifyToken } from "../middleware/authMiddleware";
import {
  createBooking,
  getBookings,
  getAllUnassignedBookings,
  assignEmployeeToBooking,
  deleteBooking,
  getAllAssignedBookings,
  getBookingDetailsbyId,
  getEmployeeAssignedBookings,
  getEmployeeBookingDetails,
  updateBookingStatus,
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

//Admin booking routes
router.get(
  "/get-all-unassigned-bookings",
  verifyToken,
  getAllUnassignedBookings
);
router.get("/get-all-assigned-bookings", verifyToken, getAllAssignedBookings);
router.post("/:bookingId/assign", assignEmployeeToBooking);
router.delete("/:bookingId", verifyToken, deleteBooking);

// Employee booking routes
router.get(
  "/employee/assigned-bookings",
  verifyToken,
  getEmployeeAssignedBookings
);
router.get(
  "/employee/:bookingId/details",
  verifyToken,
  getEmployeeBookingDetails
);
router.put("/employee/:bookingId/status", verifyToken, updateBookingStatus);

export default router;
