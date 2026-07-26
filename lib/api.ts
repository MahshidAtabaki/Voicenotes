import type { CaptureKind, OrganizeResult } from "./types";

/* Client-side API helpers. All provider secrets live server-side. */

/**
 * Organise real input into validated topics via the server OpenAI route.
 * Provider and authentication failures are reported to the caller for retry.
 */
export async function organize(
  input: string,
  kind: CaptureKind,
): Promise<OrganizeResult> {
  const res = await fetch("/api/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, kind }),
    });
  if (!res.ok) throw new Error("organize_failed");
  const data = (await res.json()) as OrganizeResult;
  if (!data || !Array.isArray(data.topics) || !data.topics.length) throw new Error("organize_empty");
  return data;
}
