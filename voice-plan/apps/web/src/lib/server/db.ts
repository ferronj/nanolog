import { createDb, getDb, type Database } from "@nanolog/db";
import { env } from "$env/dynamic/private";

let initialized = false;

export function initDb(): Database {
  if (!initialized) {
    // Support both Turso (libsql://) and local SQLite (file://)
    const url = env.TURSO_DATABASE_URL ?? env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL or TURSO_DATABASE_URL environment variable is required");
    }
    createDb({
      url,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    initialized = true;
  }
  return getDb();
}
