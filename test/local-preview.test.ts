import assert from "node:assert/strict";
import { test } from "node:test";
import { readPreviewCaptures, writePreviewCaptures, type PreviewStorage } from "../lib/local-preview.ts";
import { seedCaptures } from "../lib/seed.ts";

class MemoryStorage implements PreviewStorage {
  value: string | null = null;
  getItem() { return this.value; }
  setItem(_key: string, value: string) { this.value = value; }
}

test("local preview safely round-trips existing captures", () => {
  const storage = new MemoryStorage();
  const captures = seedCaptures();
  assert.equal(writePreviewCaptures(storage, captures), true);
  assert.deepEqual(readPreviewCaptures(storage), captures);
});

test("local preview safely ignores missing, malformed, and blocked storage", () => {
  const storage = new MemoryStorage();
  assert.equal(readPreviewCaptures(storage), null);
  storage.value = "not json";
  assert.equal(readPreviewCaptures(storage), null);
  const blocked: PreviewStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readPreviewCaptures(blocked), null);
  assert.equal(writePreviewCaptures(blocked, []), false);
});
