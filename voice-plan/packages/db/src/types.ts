import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { planItems, transcripts, snapshots } from "./schema.js";

// Select types (what you get back from queries)
export type PlanItem = InferSelectModel<typeof planItems>;
export type Transcript = InferSelectModel<typeof transcripts>;
export type Snapshot = InferSelectModel<typeof snapshots>;

// Insert types (what you pass to create)
export type NewPlanItem = InferInsertModel<typeof planItems>;
export type NewTranscript = InferInsertModel<typeof transcripts>;
export type NewSnapshot = InferInsertModel<typeof snapshots>;

// Status and priority enums as const values
export const PLAN_STATUS = ["todo", "in_progress", "done"] as const;
export const PRIORITY = ["high", "medium", "low"] as const;
export const EFFORT = ["small", "medium", "large"] as const;

export type PlanStatus = (typeof PLAN_STATUS)[number];
export type Priority = (typeof PRIORITY)[number];
export type Effort = (typeof EFFORT)[number];
