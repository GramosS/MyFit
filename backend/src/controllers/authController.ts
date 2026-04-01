// Registrering och inloggning.
// Lösenord hash:as med bcrypt. JWT skickas till klienten (sub = användar-id).
import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { getDb } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import nodemailer from "nodemailer";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(120),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10).max(400),
  password: z.string().min(8).max(200),
});

// Kortlivad token. Samma sub som requireAuth läser i andra controllers.
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
    // Samma meddelande om e-post eller lösenord är fel.
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

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function isoNow(d = new Date()): string {
  return d.toISOString();
}

async function sendResetEmail(to: string, resetUrl: string) {
  const smtp = env.smtp;
  const hasSmtp = Boolean(smtp.host && smtp.port && smtp.user && smtp.pass && smtp.from);
  if (!hasSmtp) {
    // eslint-disable-next-line no-console
    console.log(`[password-reset] SMTP not configured. Reset link for ${to}: ${resetUrl}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port!,
    secure: smtp.port === 465,
    auth: { user: smtp.user!, pass: smtp.pass! },
  });

  await transport.sendMail({
    from: smtp.from!,
    to,
    subject: "Återställ ditt lösenord",
    text: `Du bad om att återställa ditt lösenord.\n\nÖppna länken för att välja ett nytt lösenord:\n${resetUrl}\n\nOm du inte bad om detta kan du ignorera mejlet.`,
  });
}

// POST /auth/forgot-password
// Returnerar alltid 200 för att inte avslöja om mejlen finns.
export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const db = getDb();
    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(body.email) as { id: number; email: string } | undefined;

    // Svara direkt oavsett.
    res.json({ ok: true });

    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    db.prepare("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
      .run(user.id, tokenHash, isoNow(expires));

    const resetUrl = `${env.appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendResetEmail(user.email, resetUrl);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

// POST /auth/reset-password
export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const db = getDb();
    const tokenHash = sha256(body.token);

    const row = db
      .prepare(
        "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? ORDER BY id DESC LIMIT 1"
      )
      .get(tokenHash) as { id: number; user_id: number; expires_at: string; used_at: string | null } | undefined;

    if (!row) throw new HttpError(400, "Ogiltig eller utgången länk");
    if (row.used_at) throw new HttpError(400, "Ogiltig eller utgången länk");
    if (Date.parse(row.expires_at) <= Date.now()) throw new HttpError(400, "Ogiltig eller utgången länk");

    const passwordHash = await bcrypt.hash(body.password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, row.user_id);
    db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?").run(isoNow(), row.id);

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};
