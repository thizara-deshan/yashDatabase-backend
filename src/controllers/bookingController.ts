import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
const updateStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  notes: z.string().optional(),
});

const prisma = new PrismaClient();

//customer booking controller functions
export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const tourPackage = await prisma.tourPackage.findUnique({
      where: { id: req.body.tourPackageId },
    });

    if (!tourPackage) {
      res.status(404).json({ message: "Tour package not found" });
      return;
    }

    const totalAmount = tourPackage.prices * req.body.numberOfPeople;

    const booking = await prisma.booking.create({
      data: {
        travelDate: req.body.travelDate, // Make sure travelDate is provided in the request body
        numberOfPeople: req.body.numberOfPeople,
        totalAmount,
        specialRequests: req.body.specialRequests || "",
        phone: req.body.phone || "",
        country: req.body.country || "",
        status: "PENDING",
        customer: {
          connect: { id: userId },
        },
        tourPackage: {
          connect: { id: req.body.tourPackageId },
        },
      },
      include: {
        tourPackage: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        status: {
          not: "CANCELLED", // Exclude cancelled bookings
        },
      },
      include: {
        tourPackage: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(bookings);
    console.log("Bookings fetched successfully:", bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBookingDetailsbyId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const userId = req.user.id;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        tourPackage: {
          include: {
            locations: true,
            tourPlanDays: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCustomerBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const userId = req.user.id;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED", // Soft delete
      },
    });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCustomerBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const userId = req.user.id;
    const {
      tourPackageId,
      travelDate,
      numberOfPeople,
      specialRequests,
      totalAmount,
    } = req.body;
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
      },
    });
    if (!existingBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Update the booking with the new details
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        tourPackageId,
        travelDate,
        numberOfPeople,
        specialRequests,
        totalAmount,
        status: "PENDING", // Reset status to PENDING after modification
        updatedAt: new Date(), // Update the timestamp
      },
      include: {
        tourPackage: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Admin booking controller functions
export const getAllUnassignedBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const unassignedBookings = await prisma.booking.findMany({
      where: {
        assignment: null,
      },
      include: {
        tourPackage: true,
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(unassignedBookings);
  } catch (error) {
    console.error("Error fetching unassigned bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAssignedBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const assignedBookings = await prisma.assignedBooking.findMany({
      include: {
        booking: {
          include: {
            customer: true,
            tourPackage: true,
          },
        },
        employee: true,
      },
      orderBy: {
        booking: {
          createdAt: "desc",
        },
      },
    });
    res.status(200).json(assignedBookings);
  } catch (error) {
    console.error("Error fetching assigned bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignEmployeeToBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const employeeId = parseInt(req.body.employeeId, 10);

    if (!bookingId || !employeeId) {
      res
        .status(400)
        .json({ message: "Booking ID and Employee ID are required" });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Validate employee exists and is EMPLOYEE
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });
    if (!employee || employee.role !== "EMPLOYEE") {
      res.status(400).json({ message: "Invalid employee" });
      return;
    }

    const existingAssignment = await prisma.assignedBooking.findUnique({
      where: { bookingId },
    });
    if (existingAssignment) {
      res.status(400).json({ message: "Booking already assigned" });
      return;
    }

    // Create assignment
    const assignment = await prisma.assignedBooking.upsert({
      where: { bookingId },
      update: {
        employeeId,
        status: "ASSIGNED",
      },
      create: {
        bookingId: bookingId,
        employeeId: employeeId,
        status: "ASSIGNED",
      },
      include: {
        booking: { include: { customer: true, tourPackage: true } },
        employee: true,
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "ASSIGNED" },
    });

    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error assigning employee to booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED", // Soft delete
      },
    });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Employee booking controller functions
export const getEmployeeAssignedBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employeeId = req.user.id;

    const assignedBookings = await prisma.assignedBooking.findMany({
      where: { employeeId },
      include: {
        booking: {
          include: {
            customer: true,
            tourPackage: true,
          },
        },
      },
      orderBy: {
        booking: {
          createdAt: "desc",
        },
      },
    });
    res.status(200).json(assignedBookings);
  } catch (error) {
    console.error("Error fetching employee assigned bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEmployeeBookingDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    const assignedBooking = await prisma.assignedBooking.findFirst({
      where: {
        bookingId,
      },
      include: {
        booking: {
          include: {
            customer: true,
            tourPackage: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assignedBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    console.log("Assigned Booking Details:", assignedBooking);

    res.status(200).json(assignedBooking);
  } catch (error) {
    console.error("Error fetching employee booking details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBookingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    const { status, notes } = updateStatusSchema.parse(req.body);

    const Booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!Booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    await prisma.assignedBooking.update({
      where: { bookingId },
      data: { notes },
    });

    await prisma.booking.update({
      where: { id: Booking.id },
      data: { status },
    });

    res.status(200).json({ message: "Booking status updated successfully" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
