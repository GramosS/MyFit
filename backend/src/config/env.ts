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
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

