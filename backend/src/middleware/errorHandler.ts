// Global felhantering för Express.
// HttpError: kontrollerade 4xx/5xx med känt meddelande (utom 500).
// Okända fel → 500. Stack loggas på servern, klienten får ett enkelt meddelande.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/httpError.js";

// Ingen route matchade – sätts sist före errorHandler.
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not found" });
};

// Hämtar statuskod från HttpError eller fel med status/statusCode.
function resolveStatus(err: unknown): number {
  if (err instanceof HttpError) return err.statusCode;
  if (err && typeof err === "object") {
    const e = err as { status?: unknown; statusCode?: unknown };
    const raw = e.status ?? e.statusCode;
    if (typeof raw === "number" && Number.isInteger(raw) && raw >= 400 && raw < 600) {
      return raw;
    }
  }
  return 500;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = resolveStatus(err);
  const message = status === 500 ? "Internal server error" : String((err as Error)?.message ?? "Error");

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
};
