import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { planItems } from "@nanolog/db";
import { asc } from "drizzle-orm";
import { renderPlanMarkdown } from "$lib/server/planExport";

// GET /api/plan/export — download plan as markdown
export const GET: RequestHandler = async () => {
  const db = initDb();
  const items = await db
    .select()
    .from(planItems)
    .orderBy(asc(planItems.sortOrder));

  const markdown = renderPlanMarkdown(items);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plan.md"',
    },
  });
};
