// Träningspass med övningar.
// Skapa/uppdatera kör transaktion: pass först, sedan övningar.
import type { RequestHandler } from "express";
import { z } from "zod";
import { getDb } from "../config/db.js";
import { parseUserId } from "../utils/parseUserId.js";

const exerciseSchema = z.object({
  name: z.string().min(1).max(120),
  weight: z.number().min(0),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
});

const createWorkoutSchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().min(8).max(30),
  exercises: z.array(exerciseSchema).min(1),
});

const updateWorkoutSchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().min(8).max(30),
  exercises: z.array(exerciseSchema).min(1),
});

type WorkoutRow = {
  id: number;
  user_id: number;
  title: string;
  date: string;
  created_at: string;
};

type ExerciseRow = {
  id: number;
  workout_id: number;
  name: string;
  weight: number;
  sets: number;
  reps: number;
};

// API-svar: id som strängar (enklare i JSON/TypeScript).
function mapWorkout(workout: WorkoutRow, exercises: ExerciseRow[]) {
  return {
    id: String(workout.id),
    title: workout.title,
    date: workout.date,
    createdAt: workout.created_at,
    exercises: exercises.map((ex) => ({
      id: String(ex.id),
      name: ex.name,
      weight: ex.weight,
      sets: ex.sets,
      reps: ex.reps,
    })),
  };
}

export const getWorkouts: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const db = getDb();

    const workouts = db
      .prepare("SELECT id, user_id, title, date, created_at FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC")
      .all(userId) as WorkoutRow[];

    // En prepared statement återanvänds per workout (effektivt för många pass)
    const getExercises = db
      .prepare("SELECT id, workout_id, name, weight, sets, reps FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC");

    const items = workouts.map((workout) => {
      const exercises = getExercises.all(workout.id) as ExerciseRow[];
      return mapWorkout(workout, exercises);
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const createWorkout: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const body = createWorkoutSchema.parse(req.body);
    const db = getDb();

    const tx = db.transaction(() => {
      const workoutResult = db
        .prepare("INSERT INTO workouts (user_id, title, date) VALUES (?, ?, ?)")
        .run(userId, body.title, body.date);

      const workoutId = Number(workoutResult.lastInsertRowid);
      const insertExercise = db.prepare(
        "INSERT INTO workout_exercises (workout_id, name, weight, sets, reps) VALUES (?, ?, ?, ?, ?)"
      );

      body.exercises.forEach((ex) => {
        insertExercise.run(workoutId, ex.name, ex.weight, ex.sets, ex.reps);
      });

      return workoutId;
    });

    const workoutId = tx();
    const workout = db
      .prepare("SELECT id, user_id, title, date, created_at FROM workouts WHERE id = ? AND user_id = ?")
      .get(workoutId, userId) as WorkoutRow | undefined;
    if (!workout) return res.status(500).json({ error: "Failed to create workout" });

    const exercises = db
      .prepare("SELECT id, workout_id, name, weight, sets, reps FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC")
      .all(workoutId) as ExerciseRow[];

    res.status(201).json({ item: mapWorkout(workout, exercises) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

export const updateWorkout: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const workoutId = Number(req.params.id);
    if (!Number.isInteger(workoutId) || workoutId <= 0) return res.status(400).json({ error: "Invalid workout id" });

    const body = updateWorkoutSchema.parse(req.body);
    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM workouts WHERE id = ? AND user_id = ?")
      .get(workoutId, userId) as { id: number } | undefined;
    if (!existing) return res.status(404).json({ error: "Workout not found" });

    const tx = db.transaction(() => {
      db.prepare("UPDATE workouts SET title = ?, date = ? WHERE id = ? AND user_id = ?").run(
        body.title,
        body.date,
        workoutId,
        userId
      );
      // Ersätt övningslista helt (enklare än diff per rad i detta projekt)
      db.prepare("DELETE FROM workout_exercises WHERE workout_id = ?").run(workoutId);
      const insertExercise = db.prepare(
        "INSERT INTO workout_exercises (workout_id, name, weight, sets, reps) VALUES (?, ?, ?, ?, ?)"
      );
      body.exercises.forEach((ex) => {
        insertExercise.run(workoutId, ex.name, ex.weight, ex.sets, ex.reps);
      });
    });

    tx();
    const workout = db
      .prepare("SELECT id, user_id, title, date, created_at FROM workouts WHERE id = ? AND user_id = ?")
      .get(workoutId, userId) as WorkoutRow | undefined;
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    const exercises = db
      .prepare("SELECT id, workout_id, name, weight, sets, reps FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC")
      .all(workoutId) as ExerciseRow[];
    res.json({ item: mapWorkout(workout, exercises) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: err.issues });
    next(err);
  }
};

export const deleteWorkout: RequestHandler = (req, res, next) => {
  try {
    const userId = parseUserId(req.user?.id);
    const workoutId = Number(req.params.id);
    if (!Number.isInteger(workoutId) || workoutId <= 0) return res.status(400).json({ error: "Invalid workout id" });

    const db = getDb();
    const result = db.prepare("DELETE FROM workouts WHERE id = ? AND user_id = ?").run(workoutId, userId);
    if (result.changes === 0) return res.status(404).json({ error: "Workout not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

