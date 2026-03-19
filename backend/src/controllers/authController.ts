import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { getDb } from "../config/db.js";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

function signToken(userId: string) {
  return jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: "7d" });
}

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(body.email) as { id: number } | undefined;
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(body.name, body.email, passwordHash);
    const userId = String(result.lastInsertRowid);

    const token = signToken(userId);
    res.status(201).json({
      token,
      user: { id: userId, name: body.name, email: body.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const db = getDb();
    const user = db
      .prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?")
      .get(body.email) as UserRow | undefined;
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(String(user.id));
    res.json({
      token,
      user: { id: String(user.id), name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

