import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { planItems } from "@nanolog/db";
import { asc, desc } from "drizzle-orm";

// GET /api/plan — list all plan items
export const GET: RequestHandler = async () => {
  const db = initDb();
  const items = await db
    .select()
    .from(planItems)
    .orderBy(asc(planItems.sortOrder));

  return json(items);
};

// POST /api/plan — create a new plan item
export const POST: RequestHandler = async ({ request }) => {
  const db = initDb();
  const body = await request.json();

  // Get next sort order
  const existing = await db
    .select({ sortOrder: planItems.sortOrder })
    .from(planItems)
    .orderBy(desc(planItems.sortOrder))
    .limit(1);

  const nextOrder = existing.length > 0 ? existing[0].sortOrder + 1 : 0;

  const [created] = await db
    .insert(planItems)
    .values({
      description: body.description,
      priority: body.priority ?? "medium",
      effort: body.effort ?? "medium",
      status: body.status ?? "todo",
      sortOrder: nextOrder,
    })
    .returning();

  return json(created, { status: 201 });
};
