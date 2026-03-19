import type { RequestHandler } from "express";
import { z } from "zod";
import { getDb } from "../config/db.js";

const createWeightSchema = z.object({
  weight: z.number().positive().max(500),
  date: z.string().min(8).max(30),
});

function parseUserId(reqUserId?: string) {
  const id = Number(reqUserId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid user id");
  return id;
}

type WeightRow = {
  id: number;
  user_id: number;
  weight: number;
  date: string;
  created_at: string;
};

function mapWeight(row: WeightRow) {
  return {
    id: String(row.id),
    weight: row.weight,
    date: row.date,
    createdAt: row.created_at,
  };
}

export const getWeightLogs: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const db = getDb();
    const rows = db
      .prepare("SELECT id, user_id, weight, date, created_at FROM weight_logs WHERE user_id = ? ORDER BY date DESC, id DESC")
      .all(userId) as WeightRow[];
    res.json({ items: rows.map(mapWeight) });
  } catch (err) {
    next(err);
  }
};

export const createWeightLog: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const body = createWeightSchema.parse(req.body);
    const db = getDb();

    const result = db
      .prepare("INSERT INTO weight_logs (user_id, weight, date) VALUES (?, ?, ?)")
      .run(userId, body.weight, body.date);

    const row = db
      .prepare("SELECT id, user_id, weight, date, created_at FROM weight_logs WHERE id = ? AND user_id = ?")
      .get(Number(result.lastInsertRowid), userId) as WeightRow | undefined;

    if (!row) return res.status(500).json({ error: "Failed to create weight log" });
    res.status(201).json({ item: mapWeight(row) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

