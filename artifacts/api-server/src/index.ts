// Load .env from workspace root first, then fall back to the package directory.
// The compiled output runs from artifacts/api-server/dist/, so root is 3 levels up.
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dir = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dir, "../../../.env") }); // workspace root
dotenv.config({ path: resolve(__dir, "../.env") });       // artifacts/api-server/
dotenv.config();                                           // process.cwd() fallback

import app from "./app";
import { logger } from "./lib/logger";
import { NO_DB_MODE, db, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const port = Number(process.env["PORT"] ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

// Startup diagnostics — shown in server console so you can confirm config
logger.info({
  NO_DB_MODE,
  ON_REPLIT: !!process.env.REPLIT_CONNECTORS_HOSTNAME,
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL ? "set ✓" : "NOT SET",
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID ? "set ✓" : "NOT SET",
}, "Server config");

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

if (!NO_DB_MODE) {
  seedSettings().then(() => startServer());
} else {
  startServer();
}

function startServer() {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}
