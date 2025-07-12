import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import bookingRoute from "./routes/bookingRoute";
import tourPackageRoutes from "./routes/tourPackageRoutes";
import revenueRoutes from "./routes/revenueRoutes";

dotenv.config();

const app = express();
// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoute);
app.use("/api/tour-packages", tourPackageRoutes);
app.use("/api/admin", revenueRoutes);

app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health is Ok!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
