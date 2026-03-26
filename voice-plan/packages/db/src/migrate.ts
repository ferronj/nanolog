import { createClient } from "@libsql/client";

/**
 * Run schema migrations against a local SQLite or Turso database.
 * Uses raw SQL so it works without Drizzle Kit CLI.
 */
export async function migrate(url: string, authToken?: string) {
  const client = createClient({ url, authToken });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS plan_items (
      id           TEXT PRIMARY KEY,
      description  TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'todo',
      priority     TEXT NOT NULL DEFAULT 'medium',
      effort       TEXT NOT NULL DEFAULT 'medium',
      sort_order   INTEGER NOT NULL DEFAULT 0,
      result       TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id         TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id         TEXT PRIMARY KEY,
      plan_json  TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  client.close();
}
