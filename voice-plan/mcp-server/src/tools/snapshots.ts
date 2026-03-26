import { asc } from "drizzle-orm";
import { getDb, planItems, snapshots } from "@nanolog/db";

export async function takeSnapshot() {
  const db = getDb();

  // Get current plan state
  const items = await db
    .select()
    .from(planItems)
    .orderBy(asc(planItems.sortOrder));

  const [snapshot] = await db
    .insert(snapshots)
    .values({
      planJson: JSON.stringify(items),
    })
    .returning();

  return snapshot;
}
