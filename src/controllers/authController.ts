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
