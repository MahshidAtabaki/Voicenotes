import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/config";

/**
 * Refreshes the Supabase auth session (rotating cookies) on navigation.
 * No-ops when Supabase isn't configured, so the app still runs in demo mode.
 * (Next.js 16 "proxy" convention — replaces the deprecated middleware file.)
 */
export async function proxy(request: NextRequest) {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the user so expired sessions get refreshed.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
