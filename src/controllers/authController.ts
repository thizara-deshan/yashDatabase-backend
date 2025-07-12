import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response): Promise<any> => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const allowedRoles = ["EMPLOYEE", "SUPER_ADMIN"];
  const finalRole = allowedRoles.includes(role) ? role : "CUSTOMER";

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: finalRole },
    });
    res.status(201).json({
      message: "User registered",
      user: { id: user.id, email, name, role: finalRole },
    });
  } catch (error) {
    res.status(400).json({ error: "Error creating user" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = generateToken({ id: user.id, role: user.role });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000, // 1 hour
  });
  res.json({
    message: "Login successful",
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
};

export const verify = (req: Request, res: Response) => {
  res.json({ valid: true, user: req.user });
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

const otpStorage = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateOtpToken = (email: string, otp: string): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ email, otp }, JWT_SECRET, { expiresIn: "10m" });
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
      return;
    }

    if (user.status === "INACTIVE") {
      res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact support.",
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (10 minutes)
    otpStorage.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    // Console log OTP instead of sending email
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`OTP expires in 10 minutes`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyOtpLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
      return;
    }

    // Get stored OTP
    const storedOtpData = otpStorage.get(email);

    if (!storedOtpData) {
      res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
      return;
    }

    // Check if OTP is expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStorage.delete(email);
      res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
      return;
    }

    // Check attempts limit
    if (storedOtpData.attempts >= 3) {
      otpStorage.delete(email);
      res.status(400).json({
        success: false,
        message: "Too many invalid attempts. Please request a new OTP.",
      });
      return;
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      otpStorage.set(email, storedOtpData);
      res.status(400).json({
        success: false,
        message: `Invalid OTP. ${
          3 - storedOtpData.attempts
        } attempts remaining.`,
      });
      return;
    }

    // OTP is valid, get user details and log them in
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status === "INACTIVE") {
      otpStorage.delete(email);
      res.status(403).json({
        success: false,
        message: "Account is inactive or not found",
      });
      return;
    }

    // Generate JWT token (same as login)
    const token = generateToken({ id: user.id, role: user.role });

    // Set HTTP-only cookie (same as login)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    // Remove OTP from storage
    otpStorage.delete(email);

    console.log(`✅ OTP Login successful for ${email}`);

    // Return user data (same format as login)
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify OTP Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
