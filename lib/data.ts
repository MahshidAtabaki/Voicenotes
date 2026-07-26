"use client";

import { createSupabaseBrowser } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type { CaptureSession, CreateCaptureInput } from "./types";

/** Whether the browser is configured to use Supabase (else demo/local mode). */
export const supabaseEnabled = isSupabaseConfigured();

/* ---------- Auth ---------- */
export async function signInDemo(): Promise<boolean> {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.auth.signInAnonymously();
  return !error;
}

export async function hasSession(): Promise<boolean> {
  if (!supabaseEnabled) return false;
  try {
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function signOutSupabase(): Promise<void> {
  if (!supabaseEnabled) return;
  try {
    await createSupabaseBrowser().auth.signOut();
  } catch {
    /* ignore */
  }
}

/* ---------- Captures ---------- */
export async function apiListCaptures(): Promise<CaptureSession[]> {
  const res = await fetch("/api/captures", { cache: "no-store" });
  if (!res.ok) throw new Error("list_failed");
  const data = (await res.json()) as { captures: CaptureSession[] };
  return data.captures ?? [];
}

export async function apiCreateCapture(
  input: CreateCaptureInput,
): Promise<CaptureSession | null> {
  const res = await fetch("/api/captures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("create_failed");
  const data = (await res.json()) as { capture: CaptureSession | null };
  return data.capture;
}

export async function apiUpdateCapture(
  id: string,
  patch: { shared?: boolean; archived?: boolean; title?: string; summary?: string },
): Promise<void> {
  const res = await fetch(`/api/captures/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("update_failed");
}

export async function apiDeleteCapture(id: string): Promise<void> {
  const res = await fetch(`/api/captures/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_failed");
}

export async function apiSetItemShared(id: string, shared: boolean): Promise<void> {
  const res = await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shared }),
  });
  if (!res.ok) throw new Error("sharing_failed");
}

export async function apiUpdateItem(
  id: string,
  patch: { title?: string; summary?: string },
): Promise<void> {
  const res = await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("item_update_failed");
}

/* ---------- Audio ---------- */
function extFor(blob: Blob): string {
  const t = blob.type;
  if (t.includes("webm")) return "webm";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("mp4") || t.includes("m4a")) return "mp4";
  if (t.includes("wav")) return "wav";
  return "webm";
}

/** Upload audio to the private bucket under the user's folder. Returns the path. */
export async function uploadAudio(blob: Blob): Promise<string | null> {
  if (!supabaseEnabled) return null;
  const supabase = createSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthenticated");
  const path = `${user.id}/${crypto.randomUUID()}.${extFor(blob)}`;
  const { error } = await supabase.storage
    .from("voice-captures")
    .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });
  if (error) throw error;
  return path;
}

/** Fetch a short-lived signed URL to play a saved capture's audio. */
export async function getAudioUrl(id: string): Promise<string | null> {
  if (!supabaseEnabled) return null;
  try {
    const res = await fetch(`/api/captures/${id}/audio`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

/** Server-only ElevenLabs transcription. Returns the transcript unchanged,
    or null when transcription isn't available (client keeps its fallback). */
export async function transcribeAudio(blob: Blob): Promise<string | null> {
  const fd = new FormData();
  fd.append("audio", blob, `audio.${extFor(blob)}`);
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  if (!res.ok) throw new Error("transcription_failed");
  const data = (await res.json()) as { transcript?: string | null };
  if (!data.transcript?.trim()) throw new Error("transcription_empty");
  return data.transcript;
}

export async function removeAudio(path: string): Promise<void> {
  const { error } = await createSupabaseBrowser().storage.from("voice-captures").remove([path]);
  if (error) throw error;
}
