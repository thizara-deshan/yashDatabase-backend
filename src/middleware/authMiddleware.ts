import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token;
  if (!token) res.status(401).json({ message: "Unauthorized" });
  console.log("Token received:", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    console.log("User authenticated:", req.user);
    next();
  } catch (err) {
    res.status(403).json({ message: "Forbidden" });
  }
};
