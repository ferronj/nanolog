import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { planItems } from "@nanolog/db";
import { eq } from "drizzle-orm";

// PATCH /api/plan/:id — update a plan item
export const PATCH: RequestHandler = async ({ params, request }) => {
  const db = initDb();
  const body = await request.json();

  const [updated] = await db
    .update(planItems)
    .set({
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.effort !== undefined && { effort: body.effort }),
      ...(body.result !== undefined && { result: body.result }),
      ...(body.status === "done" && {
        completedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      }),
    })
    .where(eq(planItems.id, params.id))
    .returning();

  if (!updated) {
    throw error(404, "Task not found");
  }

  return json(updated);
};

// DELETE /api/plan/:id — delete a plan item
export const DELETE: RequestHandler = async ({ params }) => {
  const db = initDb();

  const [deleted] = await db
    .delete(planItems)
    .where(eq(planItems.id, params.id))
    .returning();

  if (!deleted) {
    throw error(404, "Task not found");
  }

  return json({ success: true });
};
