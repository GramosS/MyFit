// Måltider (kostlogg).
// En rad i DB = en post. Batch skapar flera rader för samma datum/måltid.
// Query `?date=YYYY-MM-DD` filtrerar. Utan datum: all historik.
import type { RequestHandler } from "express";
import { z } from "zod";
import { getDb } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { parseUserId } from "../utils/parseUserId.js";

const mealTypeEnum = z.enum(["frukost", "lunch", "middag", "mellanmål"]);

const createMealSchema = z.object({
  mealType: mealTypeEnum,
  calories: z.number().int().min(0).max(10000),
  date: z.string().min(8).max(30),
  foodLabel: z.string().max(300).optional(),
});

const batchMealItemSchema = z.object({
  calories: z.number().int().min(0).max(10000),
  foodLabel: z.string().max(300).optional(),
});

const createMealsBatchSchema = z.object({
  mealType: mealTypeEnum,
  date: z.string().min(8).max(30),
  items: z.array(batchMealItemSchema).min(1).max(40),
});

type MealRow = {
  id: number;
  user_id: number;
  meal_type: string;
  calories: number;
  date: string;
  created_at: string;
  food_label: string | null;
};

function mapMeal(row: MealRow) {
  return {
    id: String(row.id),
    mealType: row.meal_type,
    calories: row.calories,
    date: row.date,
    createdAt: row.created_at,
    foodLabel: row.food_label ?? undefined,
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
              "SELECT id, user_id, meal_type, calories, date, created_at, food_label FROM meals WHERE user_id = ? AND date = ? ORDER BY id DESC"
            )
            .all(userId, date)
        : db
            .prepare(
              "SELECT id, user_id, meal_type, calories, date, created_at, food_label FROM meals WHERE user_id = ? ORDER BY date DESC, id DESC"
            )
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

    const label = body.foodLabel?.trim() || null;
    const result = db
      .prepare("INSERT INTO meals (user_id, meal_type, calories, date, food_label) VALUES (?, ?, ?, ?, ?)")
      .run(userId, body.mealType, body.calories, body.date, label);

    const row = db
      .prepare(
        "SELECT id, user_id, meal_type, calories, date, created_at, food_label FROM meals WHERE id = ? AND user_id = ?"
      )
      .get(Number(result.lastInsertRowid), userId) as MealRow | undefined;

    if (!row) return res.status(500).json({ error: "Failed to create meal" });
    res.status(201).json({ item: mapMeal(row) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

// Lägg flera rader i en transaktion.
// Antingen lyckas allt, eller så rullas inget tillbaka.
export const createMealsBatch: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const body = createMealsBatchSchema.parse(req.body);
    const db = getDb();

    const insert = db.prepare(
      "INSERT INTO meals (user_id, meal_type, calories, date, food_label) VALUES (?, ?, ?, ?, ?)"
    );
    const selectRow = db.prepare(
      "SELECT id, user_id, meal_type, calories, date, created_at, food_label FROM meals WHERE id = ? AND user_id = ?"
    );

    const rows = db.transaction(() => {
      const out: MealRow[] = [];
      for (const item of body.items) {
        const label = item.foodLabel?.trim() || null;
        const result = insert.run(userId, body.mealType, item.calories, body.date, label);
        const row = selectRow.get(Number(result.lastInsertRowid), userId) as MealRow | undefined;
        if (!row) throw new HttpError(500, "Insert failed");
        out.push(row);
      }
      return out;
    })();

    res.status(201).json({ items: rows.map(mapMeal) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};
