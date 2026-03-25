// Sök via Open Food Facts.
// Kräver inloggning.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchFoods } from "../controllers/foodSearchController.js";

export const foodRoutes = Router();

foodRoutes.use(requireAuth);

foodRoutes.get("/search", searchFoods);
