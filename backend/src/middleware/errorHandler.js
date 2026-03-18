export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    // keep stack out of client; log on server
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
}

