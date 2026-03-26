import { desc } from "drizzle-orm";
import { getDb, transcripts } from "@nanolog/db";

export async function getRecentTranscripts(limit: number = 5) {
  const db = getDb();
  return db
    .select()
    .from(transcripts)
    .orderBy(desc(transcripts.createdAt))
    .limit(limit);
}
