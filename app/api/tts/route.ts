import { NextResponse } from "next/server";
import { synthesize } from "@/lib/elevenlabs";
import { authorize } from "@/lib/api-security";

export const runtime = "nodejs";

const PROMPTS = { capture: "What would you like to record?" } as const;

/** GET /api/tts?prompt=... → MP3 audio for an approved prompt.
    Cacheable so static prompts are only synthesized once. */
export async function GET(req: Request) {
  const auth = await authorize(30);
  if ("response" in auth) return auth.response;
  const id = new URL(req.url).searchParams.get("prompt");
  if (!id || !(id in PROMPTS)) return NextResponse.json({ error: "invalid_prompt" }, { status: 400 });
  const text = PROMPTS[id as keyof typeof PROMPTS];

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
