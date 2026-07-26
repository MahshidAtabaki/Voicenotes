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
  await fetch(`/api/captures/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function apiDeleteCapture(id: string): Promise<void> {
  await fetch(`/api/captures/${id}`, { method: "DELETE" });
}

export async function apiSetItemShared(id: string, shared: boolean): Promise<void> {
  await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shared }),
  });
}
