// Livsstilsanteckningar.
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createNote, getNotes } from "../controllers/noteController.js";

export const noteRoutes = Router();

noteRoutes.use(requireAuth);

noteRoutes.get("/", getNotes);
noteRoutes.post("/", createNote);
