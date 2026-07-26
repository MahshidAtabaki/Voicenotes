import "server-only";
import OpenAI, { toFile } from "openai";

/** Secondary speech-to-text provider when ElevenLabs is unavailable. */
export async function transcribeWithOpenAI(audio: Blob): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const bytes = new Uint8Array(await audio.arrayBuffer());
  const file = await toFile(bytes, "audio.webm", {
    type: audio.type || "audio/webm",
  });
  const client = new OpenAI({ apiKey });
  const result = await client.audio.transcriptions.create({
    file,
    model:
      process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    response_format: "json",
  });
  const text = result.text?.trim();
  return text || null;
}
