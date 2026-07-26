import "server-only";
import { NextResponse } from "next/server";
import { getUserId } from "./supabase/repo";

const buckets = new Map<string, { count: number; reset: number }>();
export async function authorize(limit = 30): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await getUserId();
  if (!userId) return { response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const now = Date.now(), old = buckets.get(userId);
  const bucket = !old || old.reset <= now ? { count: 0, reset: now + 60_000 } : old;
  bucket.count++; buckets.set(userId, bucket);
  if (bucket.count > limit) return { response: NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.reset-now)/1000)) } }) };
  return { userId };
}
