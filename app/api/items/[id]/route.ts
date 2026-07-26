import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserId, setItemShared } from "@/lib/supabase/repo";

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
  const shared = (body as { shared?: unknown })?.shared;
  if (typeof shared !== "boolean")
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  try {
    if (!(await getUserId()))
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    await setItemShared(id, shared);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
