import type { RequestHandler } from "express";
import { z } from "zod";
import { getDb } from "../config/db.js";

const mealTypeEnum = z.enum(["frukost", "lunch", "middag", "mellanmål"]);

const createMealSchema = z.object({
  mealType: mealTypeEnum,
  calories: z.number().int().min(0).max(10000),
  date: z.string().min(8).max(30),
});

function parseUserId(reqUserId?: string) {
  const id = Number(reqUserId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid user id");
  return id;
}

type MealRow = {
  id: number;
  user_id: number;
  meal_type: string;
  calories: number;
  date: string;
  created_at: string;
};

function mapMeal(row: MealRow) {
  return {
    id: String(row.id),
    mealType: row.meal_type,
    calories: row.calories,
    date: row.date,
    createdAt: row.created_at,
  };
}

export const getMeals: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const date = typeof req.query.date === "string" && req.query.date.trim().length > 0 ? req.query.date.trim() : null;
    const db = getDb();

    const rows = (
      date
        ? db
            .prepare(
              "SELECT id, user_id, meal_type, calories, date, created_at FROM meals WHERE user_id = ? AND date = ? ORDER BY id DESC"
            )
            .all(userId, date)
        : db
            .prepare("SELECT id, user_id, meal_type, calories, date, created_at FROM meals WHERE user_id = ? ORDER BY date DESC, id DESC")
            .all(userId)
    ) as MealRow[];

    res.json({ items: rows.map(mapMeal) });
  } catch (err) {
    next(err);
  }
};

export const createMeal: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const body = createMealSchema.parse(req.body);
    const db = getDb();

    const result = db
      .prepare("INSERT INTO meals (user_id, meal_type, calories, date) VALUES (?, ?, ?, ?)")
      .run(userId, body.mealType, body.calories, body.date);

    const row = db
      .prepare("SELECT id, user_id, meal_type, calories, date, created_at FROM meals WHERE id = ? AND user_id = ?")
      .get(Number(result.lastInsertRowid), userId) as MealRow | undefined;

    if (!row) return res.status(500).json({ error: "Failed to create meal" });
    res.status(201).json({ item: mapMeal(row) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

