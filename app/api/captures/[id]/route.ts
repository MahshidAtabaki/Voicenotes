import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteCapture,
  getCapture,
  getUserId,
  updateCapture,
} from "@/lib/supabase/repo";
import { CaptureNotFoundError } from "@/lib/capture-deletion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const { id } = await params;
  try {
    if (!(await getUserId()))
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const capture = await getCapture(id);
    if (!capture) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ capture });
  } catch {
    return NextResponse.json({ error: "get_failed" }, { status: 500 });
  }
}

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
  const b = (body ?? {}) as {
    shared?: unknown;
    archived?: unknown;
    title?: unknown;
    summary?: unknown;
  };
  const patch: {
    shared?: boolean;
    archived?: boolean;
    title?: string;
    summary?: string;
  } = {};
  if (typeof b.shared === "boolean") patch.shared = b.shared;
  if (typeof b.archived === "boolean") patch.archived = b.archived;
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.summary === "string") patch.summary = b.summary;

  try {
    if (!(await getUserId()))
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    await updateCapture(id, patch);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const { id } = await params;
  let authenticatedUserId: string | null = null;
  try {
    const userId = await getUserId();
    authenticatedUserId = userId;
    if (!userId)
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    await deleteCapture(id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CaptureNotFoundError)
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    console.error("Capture deletion failed", {
      captureId: id,
      userId: authenticatedUserId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "unknown_error",
      errorCode:
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : undefined,
    });
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
