import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createMeal, getMeals } from "../controllers/mealController.js";

export const mealRoutes = Router();

mealRoutes.use(requireAuth);

mealRoutes.get("/", getMeals);
mealRoutes.post("/", createMeal);

