#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createDb } from "@voice-plan/db";
import {
  getPlan,
  getPendingTasks,
  getTask,
  claimTask,
  completeTask,
  createTask,
} from "./tools/plan.js";
import { getRecentTranscripts } from "./tools/transcripts.js";
import { takeSnapshot } from "./tools/snapshots.js";

// Initialize database from environment
const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.error("TURSO_DATABASE_URL environment variable is required");
  process.exit(1);
}

createDb({ url: dbUrl, authToken: dbToken });

// Create MCP server
const server = new McpServer({
  name: "voice-plan",
  version: "0.1.0",
});

// --- Plan Tools ---

server.tool(
  "get_plan",
  "Get the full action plan with all tasks grouped by status (in_progress, todo, done)",
  {},
  async () => {
    const plan = await getPlan();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(plan, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_pending_tasks",
  "Get tasks that are waiting to be executed (status: todo). Returns tasks ordered by sort_order with priority and effort metadata.",
  {},
  async () => {
    const tasks = await getPendingTasks();
    return {
      content: [
        {
          type: "text" as const,
          text:
            tasks.length === 0
              ? "No pending tasks."
              : JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_task",
  "Get full details for a specific task by its ID",
  { id: z.string().describe("The task ID") },
  async ({ id }) => {
    const task = await getTask(id);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }],
    };
  }
);

server.tool(
  "claim_task",
  "Mark a task as 'in_progress' to indicate you are working on it. The web UI will show this task as being actively worked on.",
  { id: z.string().describe("The task ID to claim") },
  async ({ id }) => {
    const task = await claimTask(id);
    return {
      content: [
        {
          type: "text" as const,
          text: `Claimed task: "${task.description}" — now in_progress`,
        },
      ],
    };
  }
);

server.tool(
  "complete_task",
  "Mark a task as done with a result summary. Write a concise description of what was accomplished.",
  {
    id: z.string().describe("The task ID to complete"),
    result: z
      .string()
      .describe(
        "A concise summary of what was done and the outcome (1-3 sentences)"
      ),
  },
  async ({ id, result }) => {
    const task = await completeTask(id, result);
    return {
      content: [
        {
          type: "text" as const,
          text: `Completed task: "${task.description}"\nResult: ${result}`,
        },
      ],
    };
  }
);

server.tool(
  "create_task",
  "Add a new task to the plan. Use this when you discover subtasks or new work items during execution.",
  {
    description: z.string().describe("What needs to be done"),
    priority: z
      .enum(["high", "medium", "low"])
      .default("medium")
      .describe("Task priority"),
    effort: z
      .enum(["small", "medium", "large"])
      .default("medium")
      .describe("Estimated effort"),
  },
  async ({ description, priority, effort }) => {
    const task = await createTask(description, priority, effort);
    return {
      content: [
        {
          type: "text" as const,
          text: `Created task: "${task.description}" (priority: ${priority}, effort: ${effort})`,
        },
      ],
    };
  }
);

// --- Transcript Tools ---

server.tool(
  "get_recent_transcripts",
  "Read recent voice transcripts to understand what the user has been thinking and saying. Useful for context when executing tasks.",
  {
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Number of recent transcripts to return"),
  },
  async ({ limit }) => {
    const items = await getRecentTranscripts(limit);
    return {
      content: [
        {
          type: "text" as const,
          text:
            items.length === 0
              ? "No transcripts yet."
              : JSON.stringify(items, null, 2),
        },
      ],
    };
  }
);

// --- Snapshot Tools ---

server.tool(
  "take_snapshot",
  "Save a snapshot of the current plan state. Do this before making significant changes.",
  {},
  async () => {
    const snapshot = await takeSnapshot();
    return {
      content: [
        {
          type: "text" as const,
          text: `Snapshot saved at ${snapshot.createdAt} (id: ${snapshot.id})`,
        },
      ],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Voice Plan MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
