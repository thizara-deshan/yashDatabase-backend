import { Router } from "express";
import {
  getTourPackages,
  getDestinations,
  createTourPackage,
  getDestinationsById,
} from "../controllers/tourPackageController";
// import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/get-tour-packages", getTourPackages);
router.get("/get-destinations", getDestinations);
router.get("/get-destinations/:id", getDestinationsById);
router.post("/create-tour-package", createTourPackage);

export default router;
