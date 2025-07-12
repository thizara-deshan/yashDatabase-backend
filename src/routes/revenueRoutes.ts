import { Router } from "express";
import {
  getRevenueOverview,
  getRevenueByPackage,
} from "../controllers/revenueController";

const router = Router();

router.get("/revenue/overview", getRevenueOverview);
router.get("/revenue/packages", getRevenueByPackage);

export default router;
