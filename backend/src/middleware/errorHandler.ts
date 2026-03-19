import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = (err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500) as number;
  const message = status === 500 ? "Internal server error" : String(err?.message ?? "Error");

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
};

