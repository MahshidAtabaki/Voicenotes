import { NextResponse } from "next/server";
import { synthesize } from "@/lib/elevenlabs";

export const runtime = "nodejs";

const MAX_TEXT = 400;

/** GET /api/tts?text=... → MP3 audio for a short spoken prompt.
    Cacheable so static prompts are only synthesized once. */
export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text")?.trim();
  if (!text) return NextResponse.json({ error: "missing_text" }, { status: 400 });
  if (text.length > MAX_TEXT)
    return NextResponse.json({ error: "text_too_long" }, { status: 413 });

  try {
    const audio = await synthesize(text);
    if (!audio) {
      return NextResponse.json({ error: "not_configured" }, { status: 501 });
    }
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        // Static prompts rarely change — allow aggressive caching.
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
}
