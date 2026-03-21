import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const planItems = sqliteTable("plan_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "").slice(0, 16)),
  description: text("description").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .notNull()
    .default("todo"),
  priority: text("priority", { enum: ["high", "medium", "low"] })
    .notNull()
    .default("medium"),
  effort: text("effort", { enum: ["small", "medium", "large"] })
    .notNull()
    .default("medium"),
  sortOrder: integer("sort_order").notNull().default(0),
  result: text("result"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const transcripts = sqliteTable("transcripts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "").slice(0, 16)),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const snapshots = sqliteTable("snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace(/-/g, "").slice(0, 16)),
  planJson: text("plan_json").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
