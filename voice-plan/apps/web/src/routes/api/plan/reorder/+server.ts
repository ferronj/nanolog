import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { planItems } from "@voice-plan/db";
import { eq } from "drizzle-orm";

// PUT /api/plan/reorder — batch update sort orders
export const PUT: RequestHandler = async ({ request }) => {
  const db = initDb();
  const body: { id: string; sortOrder: number }[] = await request.json();

  for (const { id, sortOrder } of body) {
    await db
      .update(planItems)
      .set({ sortOrder })
      .where(eq(planItems.id, id));
  }

  return json({ success: true });
};
