import { HttpError } from "./httpError.js";

// JWT `sub` måste vara ett numeriskt user-id.
// Annars 401 (saknad/ogiltig användarkontext).
export function parseUserId(reqUserId?: string): number {
  const id = Number(reqUserId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(401, "Invalid or missing user");
  }
  return id;
}
