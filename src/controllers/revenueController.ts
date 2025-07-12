import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getRevenueOverview = async (req: Request, res: Response) => {
  try {
    // Get total revenue and bookings for all time
    const totalStats = await prisma.booking.aggregate({
      where: {
        status: "ACCEPTED",
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        totalAmount: true,
      },
    });

    const data = {
      totalRevenue: totalStats._sum.totalAmount || 0,
      totalBookings: totalStats._count.id || 0,
      averageBookingValue: totalStats._avg.totalAmount || 0,
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching revenue overview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRevenueByPackage = async (req: Request, res: Response) => {
  try {
    const packageRevenue = await prisma.booking.groupBy({
      where: {
        status: "ACCEPTED",
      },
      by: ["tourPackageId"],
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        totalAmount: true,
      },
    });

    // Get package details
    const packageIds = packageRevenue.map((p) => p.tourPackageId);
    const packages = await prisma.tourPackage.findMany({
      where: {
        id: {
          in: packageIds,
        },
      },
      select: {
        id: true,
        title: true,
        country: true,
        packageType: true,
      },
    });

    const data = packageRevenue
      .map((revenue) => {
        const packageInfo = packages.find(
          (p) => p.id === revenue.tourPackageId
        );
        return {
          packageId: revenue.tourPackageId,
          packageTitle: packageInfo?.title || "Unknown Package",
          country: packageInfo?.country || "Unknown",
          packageType: packageInfo?.packageType || "Unknown",
          totalRevenue: revenue._sum.totalAmount || 0,
          totalBookings: revenue._count.id || 0,
          averageBookingValue: revenue._avg.totalAmount || 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching package revenue:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
