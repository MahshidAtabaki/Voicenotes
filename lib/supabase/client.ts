"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

/** Browser Supabase client (uses the publishable/anon key only). */
export function createSupabaseBrowser() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(url, key);
}
