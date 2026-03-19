import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createWeightLog, getWeightLogs } from "../controllers/weightController.js";

export const weightRoutes = Router();

weightRoutes.use(requireAuth);

weightRoutes.get("/", getWeightLogs);
weightRoutes.post("/", createWeightLog);

