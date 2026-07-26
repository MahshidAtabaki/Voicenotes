import { NextResponse } from "next/server";
import { organizeServer } from "@/lib/ai";
import type { CaptureKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT = 20_000;

export async function POST(req: Request) {
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
