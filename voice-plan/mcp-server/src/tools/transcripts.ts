import { desc } from "drizzle-orm";
import { getDb, transcripts } from "@voice-plan/db";

export async function getRecentTranscripts(limit: number = 5) {
  const db = getDb();
  return db
    .select()
    .from(transcripts)
    .orderBy(desc(transcripts.createdAt))
    .limit(limit);
}
