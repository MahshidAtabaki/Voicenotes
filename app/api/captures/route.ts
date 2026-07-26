import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createCapture, getUserId, listCaptures } from "@/lib/supabase/repo";
import type { CreateCaptureInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const captures = await listCaptures();
    return NextResponse.json({ captures });
  } catch {
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const input = body as Partial<CreateCaptureInput>;
  if (
    !input ||
    (input.kind !== "voice" && input.kind !== "text") ||
    !Array.isArray(input.items)
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const capture = await createCapture(input as CreateCaptureInput);
    return NextResponse.json({ capture });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
