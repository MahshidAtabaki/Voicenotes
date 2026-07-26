import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserId } from "./supabase/repo";

const buckets = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, limit: number): NextResponse | null {
  const now = Date.now(), old = buckets.get(key);
  const bucket = !old || old.reset <= now ? { count: 0, reset: now + 60_000 } : old;
  bucket.count++; buckets.set(key, bucket);
  if (bucket.count <= limit) return null;
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((bucket.reset-now)/1000)) },
    },
  );
}

export async function authorize(limit = 30): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await getUserId();
  if (!userId) return { response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const limited = rateLimit(`user:${userId}`, limit);
  if (limited) return { response: limited };
  return { userId };
}

const SESSION_COOKIE = "vc_private_session";

function sessionSecret(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.OPENAI_API_KEY || null;
}

function signSession(id: string, secret: string): string {
  return createHmac("sha256", secret).update(id).digest("base64url");
}

function validSession(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const [id, signature] = token.split(".");
  if (!id || !signature) return null;
  const expected = signSession(id, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

/**
 * Protect paid AI routes without a visible login. The server issues a signed,
 * HttpOnly, same-site anonymous session and rate-limits each session.
 */
export async function authorizePrivateSession(
  limit = 20,
): Promise<{ sessionId: string } | { response: NextResponse }> {
  const secret = sessionSecret();
  if (!secret) {
    return {
      response: NextResponse.json({ error: "not_configured" }, { status: 501 }),
    };
  }
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  let sessionId = validSession(existing, secret);
  if (!sessionId) {
    sessionId = randomBytes(18).toString("base64url");
    cookieStore.set(
      SESSION_COOKIE,
      `${sessionId}.${signSession(sessionId, secret)}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      },
    );
  }
  const limited = rateLimit(`private:${sessionId}`, limit);
  return limited ? { response: limited } : { sessionId };
}
