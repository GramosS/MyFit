// Anteckningar per användare (livsstil-sidan).
// Filtrerar på `user_id` från JWT.
import type { RequestHandler } from "express";
import { z } from "zod";
import { getDb } from "../config/db.js";
import { parseUserId } from "../utils/parseUserId.js";

const createNoteSchema = z.object({
  date: z.string().min(8).max(30),
  content: z.string().min(1).max(5000),
});

type NoteRow = {
  id: number;
  user_id: number;
  date: string;
  content: string;
  created_at: string;
};

export const getNotes: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const db = getDb();
    const rows = db
      .prepare("SELECT id, user_id, date, content, created_at FROM notes WHERE user_id = ? ORDER BY date DESC, id DESC")
      .all(userId) as NoteRow[];
    res.json({
      items: rows.map((r) => ({
        id: String(r.id),
        date: r.date,
        content: r.content,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const createNote: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const body = createNoteSchema.parse(req.body);
    const db = getDb();
    const result = db.prepare("INSERT INTO notes (user_id, date, content) VALUES (?, ?, ?)").run(userId, body.date, body.content);
    const row = db
      .prepare("SELECT id, user_id, date, content, created_at FROM notes WHERE id = ? AND user_id = ?")
      .get(Number(result.lastInsertRowid), userId) as NoteRow | undefined;
    if (!row) return res.status(500).json({ error: "Failed to create note" });
    res.status(201).json({
      item: {
        id: String(row.id),
        date: row.date,
        content: row.content,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};
