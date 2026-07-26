import { NextResponse } from "next/server";
import { transcribe } from "@/lib/elevenlabs";
import { transcribeWithOpenAI } from "@/lib/openai-transcription";
import { authorizePrivateSession } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  const auth = await authorizePrivateSession(10);
  if ("response" in auth) return auth.response;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "missing_audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "audio_too_large" }, { status: 413 });
  }

  let transcript: string | null = null;
  try {
    transcript = await transcribe(audio);
  } catch {
    /* Try the secondary provider below. */
  }
  if (!transcript) {
    try {
      transcript = await transcribeWithOpenAI(audio);
    } catch {
      /* Return one safe error after both providers fail. */
    }
  }
  if (!transcript) {
    return NextResponse.json({ error: "transcription_failed" }, { status: 502 });
  }
  return NextResponse.json({ transcript });
}
