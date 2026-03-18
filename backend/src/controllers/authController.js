import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ name: body.name, email: body.email, passwordHash });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
}

