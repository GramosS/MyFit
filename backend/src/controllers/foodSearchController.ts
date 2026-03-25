// Sök på livsmedel.
// Läser `q` och skickar till openFoodFactsSearch.
// Kräver inloggning så extern API inte missbrukas anonymt.
import type { RequestHandler } from "express";
import { searchOpenFoodFacts } from "../services/openFoodFactsSearch.js";

export const searchFoods: RequestHandler = async (req, res, next) => {
  try {
    const raw = typeof req.query.q === "string" ? req.query.q : "";
    const swedishOnly = req.query.swedish === "1" || req.query.swedish === "true";
    const items = await searchOpenFoodFacts(raw, swedishOnly);
    res.json({ items, source: "openfoodfacts" });
  } catch (err) {
    next(err);
  }
};
