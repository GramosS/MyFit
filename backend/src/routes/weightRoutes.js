import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const weightRoutes = Router();

weightRoutes.use(requireAuth);

weightRoutes.get("/", (req, res) => {
  res.json({ items: [], note: "TODO: implement GET /api/weight" });
});

weightRoutes.post("/", (req, res) => {
  res.status(201).json({ note: "TODO: implement POST /api/weight" });
});

