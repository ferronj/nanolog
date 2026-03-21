import Anthropic from "@anthropic-ai/sdk";
import { env } from "$env/dynamic/private";
import { retry } from "./retry.js";
import type { PlanItem } from "@voice-plan/db";

// System prompt ported from planner.py lines 22-38
const SYSTEM_PROMPT = `You are a personal productivity assistant. Your job is to parse voice transcripts and extract actionable items, then merge them into the user's existing plan.

Rules:
1. Extract clear, specific action items from the transcript.
2. Each item should be a concrete task, not a vague idea.
3. Assign priority (high/medium/low) based on urgency cues in the speech.
4. Assign effort (small/medium/large) based on complexity.
5. Avoid duplicates — if a similar task exists, update it rather than creating a new one.
6. Group related tasks logically.
7. Return ONLY valid JSON, no markdown or explanation.

Return a JSON array of objects with this shape:
[
  {
    "description": "Task description",
    "priority": "high" | "medium" | "low",
    "effort": "small" | "medium" | "large"
  }
]`;

export interface GeneratedTask {
  description: string;
  priority: "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
}

export async function generatePlanItems(
  transcript: string,
  existingItems: PlanItem[]
): Promise<GeneratedTask[]> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const client = new Anthropic({ apiKey });

  const existingDescriptions = existingItems
    .map((i) => `- [${i.status}] ${i.description} (priority: ${i.priority})`)
    .join("\n");

  const userMessage = `Here is the user's current plan:
${existingDescriptions || "(empty plan)"}

Here is the new voice transcript:
"${transcript}"

Extract new action items from this transcript. Do not duplicate existing tasks. Return JSON array only.`;

  const result = await retry(async () => {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    return JSON.parse(jsonMatch[0]) as GeneratedTask[];
  });

  return result;
}
