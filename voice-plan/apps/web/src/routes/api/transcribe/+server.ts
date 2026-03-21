import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { initDb } from "$lib/server/db";
import { transcripts } from "@voice-plan/db";
import { transcribeAudio } from "$lib/server/whisper";

// POST /api/transcribe — upload audio, get transcript
export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    throw error(400, "No audio file provided");
  }

  const buffer = await audioFile.arrayBuffer();
  const transcript = await transcribeAudio(buffer, audioFile.type);

  // Save to database
  const db = initDb();
  const [saved] = await db
    .insert(transcripts)
    .values({ content: transcript })
    .returning();

  return json({
    id: saved.id,
    content: transcript,
    createdAt: saved.createdAt,
  });
};
