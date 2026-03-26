import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { snapshots } from "@nanolog/db";
import { desc } from "drizzle-orm";

// GET /api/snapshots — list recent snapshots
export const GET: RequestHandler = async ({ url }) => {
  const db = initDb();
  const limit = parseInt(url.searchParams.get("limit") ?? "10");

  const items = await db
    .select()
    .from(snapshots)
    .orderBy(desc(snapshots.createdAt))
    .limit(limit);

  return json(items);
};
