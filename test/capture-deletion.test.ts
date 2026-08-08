import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CaptureNotFoundError,
  deletionStateAfterSuccess,
  permanentlyDeleteOwnedCapture,
  type CaptureDeletionAdapter,
  type OwnedCaptureForDeletion,
} from "../lib/capture-deletion.ts";
import type { CaptureSession } from "../lib/types.ts";

function fixture(kind: "voice" | "text" = "voice"): CaptureSession {
  return {
    id: "capture-1",
    kind,
    title: "Capture",
    summary: "Summary",
    originalText: kind === "text" ? "Exact words" : null,
    transcript: kind === "voice" ? "Exact words" : null,
    audioPath: kind === "voice" ? "user-1/capture-1.webm" : null,
    durationSeconds: kind === "voice" ? 12 : null,
    shared: false,
    archived: false,
    createdAt: "Today",
    items: [{
      id: "item-1", sessionId: "capture-1", order: 0, type: "thought",
      sourceText: "Exact words", startCharacter: 0, endCharacter: 11,
      title: "Organised title", summary: "Organised summary",
      emotions: [{ label: "anxious", confirmed: true }], topics: ["fundraising"], shared: false,
    }],
  };
}

function memoryAdapter(capture: CaptureSession, owner = "user-1") {
  const rows = {
    capture: { id: capture.id, userId: owner, audioPath: capture.audioPath } as OwnedCaptureForDeletion | null,
    items: [...capture.items],
    tags: capture.items.flatMap((item) => [...item.emotions, ...item.topics]),
    audio: new Set(capture.audioPath ? [capture.audioPath] : []),
  };
  const adapter: CaptureDeletionAdapter = {
    async findOwnedCapture(id, userId) {
      return rows.capture?.id === id && rows.capture.userId === userId ? rows.capture : null;
    },
    async removeAudio(path) {
      rows.audio.delete(path);
    },
    async deleteDatabaseCapture(id, userId) {
      if (rows.capture?.id !== id || rows.capture.userId !== userId) return false;
      rows.capture = null;
      rows.items = [];
      rows.tags = [];
      return true;
    },
  };
  return { adapter, rows };
}

test("voice deletion removes Storage audio and cascades organised items and tags", async () => {
  const { adapter, rows } = memoryAdapter(fixture("voice"));
  await permanentlyDeleteOwnedCapture("capture-1", "user-1", adapter);
  assert.equal(rows.capture, null);
  assert.deepEqual(rows.items, []);
  assert.deepEqual(rows.tags, []);
  assert.equal(rows.audio.size, 0);
});

test("text-only deletion succeeds without attempting Storage deletion", async () => {
  const { adapter, rows } = memoryAdapter(fixture("text"));
  let storageCalls = 0;
  adapter.removeAudio = async () => { storageCalls += 1; };
  await permanentlyDeleteOwnedCapture("capture-1", "user-1", adapter);
  assert.equal(rows.capture, null);
  assert.equal(storageCalls, 0);
});

test("a different owner cannot delete a capture", async () => {
  const { adapter, rows } = memoryAdapter(fixture());
  await assert.rejects(
    () => permanentlyDeleteOwnedCapture("capture-1", "user-2", adapter),
    CaptureNotFoundError,
  );
  assert.notEqual(rows.capture, null);
  assert.equal(rows.audio.size, 1);
});

test("failed database deletion retains UI data and can be retried", async () => {
  const { adapter, rows } = memoryAdapter(fixture());
  const realDelete = adapter.deleteDatabaseCapture;
  let attempts = 0;
  adapter.deleteDatabaseCapture = async (...args) => {
    attempts += 1;
    if (attempts === 1) throw new Error("database unavailable");
    return realDelete(...args);
  };
  await assert.rejects(() => permanentlyDeleteOwnedCapture("capture-1", "user-1", adapter));
  assert.notEqual(rows.capture, null);
  await permanentlyDeleteOwnedCapture("capture-1", "user-1", adapter);
  assert.equal(rows.capture, null);
  assert.equal(attempts, 2);
});

test("successful deletion identifies and removes the currently playing capture", () => {
  const capture = fixture();
  const result = deletionStateAfterSuccess([capture, { ...capture, id: "capture-2" }], capture.id, capture.id);
  assert.equal(result.closePlayer, true);
  assert.deepEqual(result.captures.map((item) => item.id), ["capture-2"]);
});
