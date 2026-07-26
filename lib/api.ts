import { heuristicOrganize } from "./organize";
import type { CaptureKind, OrganizeResult } from "./types";

/* Client-side API helpers. All provider secrets live server-side; the client
   only ever talks to our own /api routes. Each helper degrades gracefully so
   the UI stays functional before/without credentials. */

/**
 * Organise real input into validated topics via the server OpenAI route.
 * Falls back to the local deterministic organiser if the route is
 * unavailable (e.g. no key configured yet), so text capture always works.
 */
export async function organize(
  input: string,
  kind: CaptureKind,
): Promise<OrganizeResult> {
  try {
    const res = await fetch("/api/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, kind }),
    });
    if (res.ok) {
      const data = (await res.json()) as OrganizeResult;
      if (data && Array.isArray(data.topics) && data.topics.length > 0) {
        return data;
      }
    }
  } catch {
    /* network/route unavailable — use offline organiser */
  }
  return heuristicOrganize(input);
}
