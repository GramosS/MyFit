// JWT-autentisering för skyddade rutter.
// Header: `Authorization: Bearer <token>`.
// Vid ok: sätt `req.user.id` från tokenens `sub`.
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type JwtPayload = {
  sub?: string;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  // Standardformat så klienter kan skicka samma header som i fetch()
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!payload.sub) return res.status(401).json({ error: "Invalid token" });

    req.user = { id: payload.sub };
    next();
  } catch {
    // Utgången signatur, fel hemlighet, manipulerad token, etc.
    return res.status(401).json({ error: "Invalid token" });
  }
};
