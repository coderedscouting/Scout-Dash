import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const NO_DB_MODE = !process.env.DATABASE_URL;

if (NO_DB_MODE) {
  console.warn("[db] DATABASE_URL not set — running in no-DB mode. Data will be stored in memory only.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pool = NO_DB_MODE ? null : new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = (NO_DB_MODE ? null : drizzle(pool!, { schema })) as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
