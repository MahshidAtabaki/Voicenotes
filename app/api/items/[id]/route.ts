import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserId, updateItem } from "@/lib/supabase/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const input = body as { shared?: unknown; title?: unknown; summary?: unknown };
  const patch: { shared?: boolean; title?: string; summary?: string } = {};
  if (typeof input.shared === "boolean") patch.shared = input.shared;
  if (typeof input.title === "string" && input.title.trim() && input.title.length <= 200) patch.title = input.title.trim();
  if (typeof input.summary === "string" && input.summary.trim() && input.summary.length <= 2_000) patch.summary = input.summary.trim();
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  try {
    if (!(await getUserId()))
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    await updateItem(id, patch);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
