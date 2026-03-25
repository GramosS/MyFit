// Laddar .env och exponerar typad konfiguration.
// JWT_SECRET måste finnas.
import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databasePath: process.env.DATABASE_PATH ?? "./data/myfit.db",
  jwtSecret: requireEnv("JWT_SECRET"),
  // Tillåten origin för CORS (frontend-URL).
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
