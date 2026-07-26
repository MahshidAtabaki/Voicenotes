import "server-only";
import { friendlyDate } from "../format";
import type {
  CaptureKind,
  CaptureSession,
  ContentType,
  CreateCaptureInput,
  ThoughtItem,
} from "../types";
import { createSupabaseAdmin, createSupabaseServer } from "./server";

/* Server-side data access. Every query runs under the user's session, so RLS
   guarantees users only ever read or write their own rows. */

interface TagRow {
  id: string;
  item_id: string;
  kind: "emotion" | "topic";
  label: string;
  confirmed: boolean;
}
interface ItemRow {
  id: string;
  session_id: string;
  order_index: number;
  type: ContentType;
  source_text: string;
  start_character: number;
  end_character: number;
  title: string;
  summary: string;
  shared: boolean;
}
interface SessionRow {
  id: string;
  kind: CaptureKind;
  title: string;
  summary: string;
  original_text: string | null;
  transcript: string | null;
  audio_path: string | null;
  duration_seconds: number | null;
  shared: boolean;
  archived: boolean;
  created_at: string;
}

function mapItem(row: ItemRow, tags: TagRow[]): ThoughtItem {
  const mine = tags.filter((t) => t.item_id === row.id);
  return {
    id: row.id,
    sessionId: row.session_id,
    order: row.order_index,
    type: row.type,
    sourceText: row.source_text,
    startCharacter: row.start_character,
    endCharacter: row.end_character,
    title: row.title,
    summary: row.summary,
    emotions: mine
      .filter((t) => t.kind === "emotion")
      .map((t) => ({ label: t.label, confirmed: t.confirmed })),
    topics: mine.filter((t) => t.kind === "topic").map((t) => t.label),
    shared: row.shared,
  };
}

function mapSession(row: SessionRow, items: ThoughtItem[]): CaptureSession {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    originalText: row.original_text,
    transcript: row.transcript,
    audioPath: row.audio_path,
    durationSeconds: row.duration_seconds,
    shared: row.shared,
    archived: row.archived,
    createdAt: friendlyDate(row.created_at),
    items: items.sort((a, b) => a.order - b.order),
  };
}

export async function getUserId(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listCaptures(): Promise<CaptureSession[]> {
  const supabase = await createSupabaseServer();
  const { data: sessions, error } = await supabase
    .from("capture_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (sessions ?? []) as SessionRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: itemRows } = await supabase
    .from("thought_items")
    .select("*")
    .in("session_id", ids);
  const items = (itemRows ?? []) as ItemRow[];
  const itemIds = items.map((i) => i.id);
  const { data: tagRows } = itemIds.length
    ? await supabase.from("thought_tags").select("*").in("item_id", itemIds)
    : { data: [] as TagRow[] };
  const tags = (tagRows ?? []) as TagRow[];

  return rows.map((sr) =>
    mapSession(
      sr,
      items.filter((i) => i.session_id === sr.id).map((i) => mapItem(i, tags)),
    ),
  );
}

export async function getCapture(id: string): Promise<CaptureSession | null> {
  const supabase = await createSupabaseServer();
  const { data: sr } = await supabase
    .from("capture_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sr) return null;
  const { data: itemRows } = await supabase
    .from("thought_items")
    .select("*")
    .eq("session_id", id);
  const items = (itemRows ?? []) as ItemRow[];
  const itemIds = items.map((i) => i.id);
  const { data: tagRows } = itemIds.length
    ? await supabase.from("thought_tags").select("*").in("item_id", itemIds)
    : { data: [] as TagRow[] };
  const tags = (tagRows ?? []) as TagRow[];
  return mapSession(sr as SessionRow, items.map((i) => mapItem(i, tags)));
}

export async function createCapture(
  input: CreateCaptureInput,
): Promise<CaptureSession | null> {
  const supabase = await createSupabaseServer();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: sessionRow, error: sErr } = await supabase
    .from("capture_sessions")
    .insert({
      user_id: userId,
      kind: input.kind,
      title: input.title,
      summary: input.summary,
      original_text: input.originalText,
      transcript: input.transcript,
      audio_path: input.audioPath,
      duration_seconds: input.durationSeconds,
      shared: input.shared,
    })
    .select("id")
    .single();
  if (sErr || !sessionRow) throw sErr ?? new Error("Insert failed");
  const sessionId = (sessionRow as { id: string }).id;

  for (const it of input.items) {
    const { data: itemRow, error: iErr } = await supabase
      .from("thought_items")
      .insert({
        session_id: sessionId,
        user_id: userId,
        order_index: it.order,
        type: it.type,
        source_text: it.sourceText,
        start_character: it.startCharacter,
        end_character: it.endCharacter,
        title: it.title,
        summary: it.summary,
        shared: it.shared,
      })
      .select("id")
      .single();
    if (iErr || !itemRow) throw iErr ?? new Error("Item insert failed");
    const itemId = (itemRow as { id: string }).id;

    const tagRows = [
      ...it.emotions.map((e) => ({
        item_id: itemId,
        user_id: userId,
        kind: "emotion" as const,
        label: e.label,
        confirmed: e.confirmed,
      })),
      ...it.topics.map((t) => ({
        item_id: itemId,
        user_id: userId,
        kind: "topic" as const,
        label: t,
        confirmed: true,
      })),
    ];
    if (tagRows.length) {
      const { error: tErr } = await supabase.from("thought_tags").insert(tagRows);
      if (tErr) throw tErr;
    }
  }

  return getCapture(sessionId);
}

export async function updateCapture(
  id: string,
  patch: { shared?: boolean; archived?: boolean; title?: string; summary?: string },
): Promise<void> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("capture_sessions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setItemShared(itemId: string, shared: boolean): Promise<void> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("thought_items")
    .update({ shared })
    .eq("id", itemId);
  if (error) throw error;
}

/** Delete a capture and its stored audio (DB rows cascade). */
export async function deleteCapture(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: sr } = await supabase
    .from("capture_sessions")
    .select("audio_path")
    .eq("id", id)
    .maybeSingle();
  const audioPath = (sr as { audio_path: string | null } | null)?.audio_path;

  const { error } = await supabase.from("capture_sessions").delete().eq("id", id);
  if (error) throw error;

  if (audioPath) {
    // Remove the stored object too. Ownership already enforced by the path prefix.
    try {
      const admin = createSupabaseAdmin();
      await admin.storage.from("voice-captures").remove([audioPath]);
    } catch {
      // Storage cleanup is best-effort; the DB rows are already gone.
    }
  }
}
