import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:5500",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

