// CRUD för träningspass.
// `:id` är numeriskt workout-id.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createWorkout, deleteWorkout, getWorkouts, updateWorkout } from "../controllers/workoutController.js";

export const workoutRoutes = Router();

workoutRoutes.use(requireAuth);

workoutRoutes.get("/", getWorkouts);
workoutRoutes.post("/", createWorkout);
workoutRoutes.put("/:id", updateWorkout);
workoutRoutes.delete("/:id", deleteWorkout);
