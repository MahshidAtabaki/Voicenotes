import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { organize } from "../lib/api.ts";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("organize falls back offline only for explicit not_configured", async () => {
  globalThis.fetch = async () => Response.json({ error: "not_configured" }, { status: 501 });
  const result = await organize("my exact words", "text");
  assert.equal(result.topics[0].sourceText, "my exact words");
});

for (const [status, error] of [[401, "unauthenticated"], [429, "rate_limited"], [502, "provider_failed"]] as const) {
  test(`organize does not fall back after ${error}`, async () => {
    globalThis.fetch = async () => Response.json({ error }, { status });
    await assert.rejects(() => organize("words", "text"), new RegExp(error));
  });
}
