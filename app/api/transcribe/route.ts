import { NextResponse } from "next/server";
import { transcribe } from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
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

  try {
    const transcript = await transcribe(audio);
    // transcript may be null when not configured — client keeps its fallback.
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json({ transcript: null }, { status: 200 });
  }
}
