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
  // Länkar i mejl (t.ex. återställ-länk).
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  // SMTP (valfritt): om saknas loggas reset-länk i backend-konsolen (dev).
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  },
  nodeEnv: process.env.NODE_ENV ?? "development",
};
