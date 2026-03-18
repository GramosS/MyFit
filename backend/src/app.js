import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { mealRoutes } from "./routes/mealRoutes.js";
import { weightRoutes } from "./routes/weightRoutes.js";
import { workoutRoutes } from "./routes/workoutRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/workouts", workoutRoutes);
  app.use("/api/meals", mealRoutes);
  app.use("/api/weight", weightRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

