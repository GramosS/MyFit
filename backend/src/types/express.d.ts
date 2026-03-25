// Utökar Express Request med `user` efter lyckad JWT-verifiering.
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string };
  }
}
