import { NextResponse } from "next/server";
import { organizeServer } from "@/lib/ai";
import type { CaptureKind } from "@/lib/types";
import { authorizePrivateSession } from "@/lib/api-security";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT = 20_000;

export async function POST(req: Request) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const auth = await authorizePrivateSession(20);
  if ("response" in auth) return auth.response;
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { input, kind } = (body ?? {}) as { input?: unknown; kind?: unknown };
  if (typeof input !== "string" || input.trim().length === 0) {
    return NextResponse.json({ error: "Missing input" }, { status: 400 });
  }
  if (input.length > MAX_INPUT) {
    return NextResponse.json({ error: "Input too long" }, { status: 413 });
  }
  const captureKind: CaptureKind = kind === "text" ? "text" : "voice";

  try {
    const result = await organizeServer(input, captureKind);
    return NextResponse.json(result);
  } catch {
    // Never leak provider errors/keys; the client falls back to its offline organiser.
    return NextResponse.json({ error: "Organise failed" }, { status: 502 });
  }
}
