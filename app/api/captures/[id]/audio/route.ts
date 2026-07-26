import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserId } from "@/lib/supabase/repo";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Returns a short-lived signed URL for the capture's private audio object.
    RLS ensures only the owner can read the row and the object. */
export async function GET(_req: Request, { params }: Ctx) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const { id } = await params;
  try {
    if (!(await getUserId()))
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const supabase = await createSupabaseServer();
    const { data: row } = await supabase
      .from("capture_sessions")
      .select("audio_path")
      .eq("id", id)
      .maybeSingle();
    const audioPath = (row as { audio_path: string | null } | null)?.audio_path;
    if (!audioPath) return NextResponse.json({ error: "no_audio" }, { status: 404 });

    const { data, error } = await supabase.storage
      .from("voice-captures")
      .createSignedUrl(audioPath, 60);
    if (error || !data) return NextResponse.json({ error: "sign_failed" }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: "audio_failed" }, { status: 500 });
  }
}
