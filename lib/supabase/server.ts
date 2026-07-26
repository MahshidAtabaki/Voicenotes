import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseSecretKey, supabaseUrl } from "./config";

/**
 * Request-scoped Supabase client bound to the user's cookies. RLS applies:
 * every query runs as the signed-in user, so users only ever see their data.
 */
export async function createSupabaseServer() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) throw new Error("Supabase is not configured");

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Elevated client using the service-role key. Server-only, bypasses RLS.
 * Use ONLY for trusted operations (e.g. deleting a user's own storage object
 * after verifying ownership). Never expose to the browser.
 */
export function createSupabaseAdmin() {
  const url = supabaseUrl();
  const secret = supabaseSecretKey();
  if (!url || !secret) throw new Error("Supabase admin is not configured");
  return createServerClient(url, secret, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
