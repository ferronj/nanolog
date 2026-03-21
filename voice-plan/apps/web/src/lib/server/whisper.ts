import OpenAI from "openai";
import { env } from "$env/dynamic/private";
import { retry } from "./retry.js";

// Filler words to strip (ported from transcribe.py lines 21-24)
const FILLER_PATTERN =
  /\b(um|uh|er|ah|like|you know|I mean|sort of|kind of|basically|actually|literally)\b/gi;

function cleanTranscript(text: string): string {
  return text
    .replace(FILLER_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string = "audio/webm"
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const client = new OpenAI({ apiKey });

  const file = new File([audioBuffer], "recording.webm", { type: mimeType });

  const result = await retry(async () => {
    const response = await client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "en",
    });
    return response.text;
  });

  return cleanTranscript(result);
}
