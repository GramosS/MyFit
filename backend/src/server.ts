// Entrépunkt.
// Laddar env, skapar databas, bygger Express-app och lyssnar på PORT.
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDb();
  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

