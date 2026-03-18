import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const mealRoutes = Router();

mealRoutes.use(requireAuth);

mealRoutes.get("/", (req, res) => {
  res.json({ items: [], note: "TODO: implement GET /api/meals" });
});

mealRoutes.post("/", (req, res) => {
  res.status(201).json({ note: "TODO: implement POST /api/meals" });
});

