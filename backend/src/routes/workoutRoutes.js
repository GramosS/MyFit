import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const workoutRoutes = Router();

workoutRoutes.use(requireAuth);

workoutRoutes.get("/", (req, res) => {
  res.json({ items: [], note: "TODO: implement GET /api/workouts" });
});

workoutRoutes.post("/", (req, res) => {
  res.status(201).json({ note: "TODO: implement POST /api/workouts" });
});

