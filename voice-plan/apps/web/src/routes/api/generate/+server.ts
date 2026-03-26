import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { planItems, snapshots } from "@nanolog/db";
import { asc, desc } from "drizzle-orm";
import { generatePlanItems } from "$lib/server/claude";

// POST /api/generate — generate plan items from transcript
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { transcript } = body;

  if (!transcript || typeof transcript !== "string") {
    throw error(400, "transcript is required");
  }

  const db = initDb();

  // Take snapshot before modifying
  const currentItems = await db
    .select()
    .from(planItems)
    .orderBy(asc(planItems.sortOrder));

  await db.insert(snapshots).values({
    planJson: JSON.stringify(currentItems),
  });

  // Generate new items via Claude
  const newTasks = await generatePlanItems(transcript, currentItems);

  // Get next sort order
  const last = await db
    .select({ sortOrder: planItems.sortOrder })
    .from(planItems)
    .orderBy(desc(planItems.sortOrder))
    .limit(1);

  let nextOrder = last.length > 0 ? last[0].sortOrder + 1 : 0;

  // Insert new items
  const created = [];
  for (const task of newTasks) {
    const [item] = await db
      .insert(planItems)
      .values({
        description: task.description,
        priority: task.priority,
        effort: task.effort,
        sortOrder: nextOrder++,
      })
      .returning();
    created.push(item);
  }

  return json({ created, count: created.length });
};
