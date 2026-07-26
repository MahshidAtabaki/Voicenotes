import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCapturePayload } from "../lib/validation.ts";

const valid = { kind: "text", title: "Title", summary: "Summary", originalText: "exact words", transcript: null, audioPath: null, durationSeconds: null, shared: false, items: [{ order: 0, type: "thought", sourceText: "exact", startCharacter: 0, endCharacter: 5, title: "Title", summary: "Summary", shared: false, emotions: [], topics: [] }] };
test("capture payload accepts exact sourceText ranges", () => assert.equal(validateCapturePayload(valid).success, true));
test("capture payload rejects organized words that do not exactly match original input", () => assert.equal(validateCapturePayload({ ...valid, items: [{ ...valid.items[0], sourceText: "invented" }] }).success, false));
test("capture payload rejects wrong source fields and unsafe ranges", () => {
  assert.equal(validateCapturePayload({ ...valid, transcript: "wrong kind" }).success, false);
  assert.equal(validateCapturePayload({ ...valid, items: [{ ...valid.items[0], endCharacter: 999 }] }).success, false);
});
