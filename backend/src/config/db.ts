// SQLite via better-sqlite3.
// Skapar fil, kör schema och enkla migrationer.
// All data kopplas till `user_id`.
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "./env.js";

let db: Database.Database | null = null;

// Skapar tabeller om de saknas.
// PRAGMA foreign_keys behövs för ON DELETE CASCADE.
function initSchema(connection: Database.Database) {
  connection.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      weight REAL NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      calories INTEGER NOT NULL,
      date TEXT NOT NULL,
      food_label TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);
  migrateMeals(connection);
}

// Migration för äldre databaser.
// Lägg till `food_label` utan att tappa data.
function migrateMeals(connection: Database.Database) {
  const cols = connection.prepare("PRAGMA table_info(meals)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "food_label")) {
    connection.exec("ALTER TABLE meals ADD COLUMN food_label TEXT");
  }
}

export async function connectDb() {
  const dbPath = path.resolve(process.cwd(), env.databasePath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  initSchema(db);
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDb() first.");
  }
  return db;
}
