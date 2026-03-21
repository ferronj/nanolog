import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

export type Database = LibSQLDatabase<typeof schema>;

export interface DbConfig {
  url: string;
  authToken?: string;
}

let _client: Client | null = null;
let _db: Database | null = null;

export function createDb(config: DbConfig): Database {
  _client = createClient({
    url: config.url,
    authToken: config.authToken,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

export function getDb(): Database {
  if (!_db) {
    throw new Error(
      "Database not initialized. Call createDb() first with your Turso credentials."
    );
  }
  return _db;
}

export function getClient(): Client {
  if (!_client) {
    throw new Error("Database client not initialized. Call createDb() first.");
  }
  return _client;
}
