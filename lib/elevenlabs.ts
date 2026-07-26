import "server-only";

/* ============================================================
   Server-only ElevenLabs helpers. The API key never leaves the server.
   ============================================================ */

const API = "https://api.elevenlabs.io/v1";

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/**
 * Transcribe audio with ElevenLabs Scribe. Returns the transcript verbatim.
 * The transcript is preserved exactly — never edited here.
 */
export async function transcribe(audio: Blob): Promise<string | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  const model = process.env.ELEVENLABS_STT_MODEL || "scribe_v2";

  const form = new FormData();
  form.append("model_id", model);
  form.append("file", audio, "audio.webm");

  const res = await fetch(`${API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { text?: string };
  return typeof data.text === "string" ? data.text : null;
}

/** Synthesize a short spoken prompt. Returns MP3 bytes, or null if unavailable. */
export async function synthesize(text: string): Promise<ArrayBuffer | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  const voice = process.env.ELEVENLABS_TTS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const model = process.env.ELEVENLABS_TTS_MODEL || "eleven_turbo_v2_5";

  const res = await fetch(`${API}/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: model }),
  });
  if (!res.ok) return null;
  return res.arrayBuffer();
}
