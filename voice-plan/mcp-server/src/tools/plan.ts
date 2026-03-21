import { eq, asc, desc } from "drizzle-orm";
import { getDb, planItems, type PlanStatus, type Priority, type Effort } from "@voice-plan/db";

export async function getPlan() {
  const db = getDb();
  const items = await db
    .select()
    .from(planItems)
    .orderBy(asc(planItems.sortOrder));

  const grouped = {
    in_progress: items.filter((i) => i.status === "in_progress"),
    todo: items.filter((i) => i.status === "todo"),
    done: items.filter((i) => i.status === "done"),
  };

  return grouped;
}

export async function getPendingTasks() {
  const db = getDb();
  return db
    .select()
    .from(planItems)
    .where(
      eq(planItems.status, "todo")
    )
    .orderBy(asc(planItems.sortOrder));
}

export async function getTask(id: string) {
  const db = getDb();
  const [item] = await db
    .select()
    .from(planItems)
    .where(eq(planItems.id, id))
    .limit(1);

  if (!item) {
    throw new Error(`Task not found: ${id}`);
  }
  return item;
}

export async function claimTask(id: string) {
  const db = getDb();
  const [updated] = await db
    .update(planItems)
    .set({ status: "in_progress" as PlanStatus })
    .where(eq(planItems.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Task not found: ${id}`);
  }
  return updated;
}

export async function completeTask(id: string, result: string) {
  const db = getDb();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const [updated] = await db
    .update(planItems)
    .set({
      status: "done" as PlanStatus,
      result,
      completedAt: now,
    })
    .where(eq(planItems.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Task not found: ${id}`);
  }
  return updated;
}

export async function createTask(
  description: string,
  priority: Priority = "medium",
  effort: Effort = "medium"
) {
  const db = getDb();

  // Get max sort_order to append at end
  const existing = await db
    .select({ sortOrder: planItems.sortOrder })
    .from(planItems)
    .orderBy(desc(planItems.sortOrder))
    .limit(1);

  const nextOrder = existing.length > 0 ? existing[0].sortOrder + 1 : 0;

  const [created] = await db
    .insert(planItems)
    .values({
      description,
      priority,
      effort,
      sortOrder: nextOrder,
    })
    .returning();

  return created;
}
