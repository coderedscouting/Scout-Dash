import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { db, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const port = Number(process.env["PORT"] ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

async function seedSettings() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(sql`
      INSERT INTO settings (key, value)
      VALUES
        ('event_key', '2026mimus'),
        ('event_name', '2026 FIM District Muskegon Event')
      ON CONFLICT (key) DO NOTHING
    `);

    logger.info("Settings seeded");
  } catch (err) {
    logger.warn({ err }, "Settings seed failed — continuing anyway");
  }
}

seedSettings().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
