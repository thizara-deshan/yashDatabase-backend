import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
// Validation schema matching your frontend
const createTourPackageSchema = z.object({
  title: z.string().min(3).max(255),
  country: z.string().min(2).max(100),
  packageType: z.string().min(3).max(100),
  prices: z.number().positive(),
  image: z.string(),
  alt: z.string().min(3).max(255),
  shortDescription: z.string().min(10).max(500),
  description: z.string().min(20),
  locations: z
    .array(
      z.object({
        name: z.string().min(2),
        description: z.string().min(10),
        image: z.string(),
      })
    )
    .min(1),
  tourPlanDays: z
    .array(
      z.object({
        title: z.string().min(2),
        activity: z.string().min(5),
        description: z.string().min(10),
        endOfTheDay: z.string().min(3),
      })
    )
    .min(1),
});

const prisma = new PrismaClient();

export const getTourPackages = async (req: Request, res: Response) => {
  try {
    const packages = await prisma.tourPackage.findMany({
      include: {
        locations: true,
        tourPlanDays: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(packages);
  } catch (error) {
    console.error("Error fetching tour packages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDestinations = async (req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany({
      include: {
        tourPackage: true, // Include related tour packages
      },
      orderBy: { id: "asc" },
    });

    res.json(destinations);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createTourPackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // create a new tour package
  try {
    // Validate request body
    const validatedData = createTourPackageSchema.parse(req.body);

    const destinationOps = validatedData.locations.map((loc) => ({
      where: { name: loc.name }, // checks for existing name
      create: {
        name: loc.name,
        description: loc.description,
        image: loc.image,
      },
    }));
    // Create tour package with nested relations
    const newPackage = await prisma.tourPackage.create({
      data: {
        title: validatedData.title,
        country: validatedData.country,
        packageType: validatedData.packageType,
        prices: validatedData.prices,
        image: validatedData.image,
        alt: validatedData.alt,
        shortDescription: validatedData.shortDescription,
        description: validatedData.description,
        // Create locations as nested records
        locations: {
          connectOrCreate: destinationOps,
        },
        // Create tour plan days as nested records
        tourPlanDays: {
          create: validatedData.tourPlanDays.map((day) => ({
            title: day.title,
            activity: day.activity,
            description: day.description,
            endOfTheDay: day.endOfTheDay,
          })),
        },
      },
      // Include related data in response
      include: {
        locations: true,
        tourPlanDays: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Tour package created successfully",
      data: newPackage,
    });
  } catch (error) {
    console.error("Error creating tour package:", error);
    if (error instanceof z.ZodError) {
      // Handle validation errors
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDestinationsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: Number(id) },
      include: {
        tourPackage: true, // Include related tour packages
      },
    });

    if (!destination) {
      res.status(404).json({ message: "Destination not found" });
      return;
    }

    res.json(destination);
  } catch (error) {
    console.error("Error fetching destination by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
