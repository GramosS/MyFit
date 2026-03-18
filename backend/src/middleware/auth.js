import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

