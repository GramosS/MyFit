// Måltider: lista, skapa en rad, skapa batch.
// Allt bakom JWT.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createMeal, createMealsBatch, getMeals } from "../controllers/mealController.js";

export const mealRoutes = Router();

mealRoutes.use(requireAuth);

mealRoutes.get("/", getMeals);
// Ska registreras före `POST "/"` så `/batch` inte blir felväg.
mealRoutes.post("/batch", createMealsBatch);
mealRoutes.post("/", createMeal);
