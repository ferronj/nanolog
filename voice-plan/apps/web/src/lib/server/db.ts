import { createDb, getDb, type Database } from "@voice-plan/db";
import { env } from "$env/dynamic/private";

let initialized = false;

export function initDb(): Database {
  if (!initialized) {
    if (!env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL environment variable is required");
    }
    createDb({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    initialized = true;
  }
  return getDb();
}
