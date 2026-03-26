import type { PlanItem } from "@nanolog/db";

/**
 * Render plan items as markdown matching the original plan.md format.
 * Ported from executor.py lines 24-27 regex pattern.
 */
export function renderPlanMarkdown(items: PlanItem[]): string {
  const inProgress = items.filter((i) => i.status === "in_progress");
  const todo = items.filter((i) => i.status === "todo");
  const done = items.filter((i) => i.status === "done");

  let md = "# Action Plan\n\n";
  md += "> Auto-updated by the nanolog system.\n\n";

  md += "## In Progress\n\n";
  for (const item of inProgress) {
    md += formatItem(item, false);
  }
  if (inProgress.length === 0) md += "_No tasks in progress._\n";
  md += "\n";

  md += "## To Do\n\n";
  for (const item of todo) {
    md += formatItem(item, false);
  }
  if (todo.length === 0) md += "_No pending tasks._\n";
  md += "\n";

  md += "## Done\n\n";
  for (const item of done) {
    md += formatItem(item, true);
  }
  if (done.length === 0) md += "_No completed tasks._\n";
  md += "\n";

  return md;
}

function formatItem(item: PlanItem, checked: boolean): string {
  const checkbox = checked ? "- [x]" : "- [ ]";
  const meta = `priority: ${item.priority}, effort: ${item.effort}, created: ${item.createdAt?.slice(0, 10) ?? "unknown"}`;
  let line = `${checkbox} **${item.description}** — ${meta}\n`;

  if (item.result) {
    const date = item.completedAt?.slice(0, 10) ?? "unknown";
    line += `  > Result (${date}): ${item.result}\n`;
  }

  return line;
}
