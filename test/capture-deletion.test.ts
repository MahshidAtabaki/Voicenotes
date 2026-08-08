import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CaptureNotFoundError,
  deletionStateAfterSuccess,
  deleteCaptureFromPersistence,
  isMissingStorageObject,
  permanentlyDeleteOwnedCapture,
  type CaptureDeletionAdapter,
  type OwnedCaptureForDeletion,
} from "../lib/capture-deletion.ts";
import {
  asLocalCapture,
  asRemoteCapture,
  capturePersistence,
  deleteLocalCaptureMetadata,
} from "../lib/capture-persistence.ts";
import {
  readPreviewCaptures,
  type PreviewStorage,
} from "../lib/local-preview.ts";
import { seedCaptures } from "../lib/seed.ts";
import { readFileSync } from "node:fs";
import type { CaptureSession } from "../lib/types.ts";
import {
  DELETE_ACTION_LABEL,
  DELETE_CONFIRMATION_Z_INDEX,
  findPhoneOverlayHost,
  GLOBAL_PLAYER_Z_INDEX,
  PHONE_OVERLAY_SELECTOR,
  PHONE_OVERLAY_Z_INDEX,
} from "../lib/delete-confirmation.ts";

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
  const audioPath = capture.audioPath
    ? `${owner}/${capture.audioPath.split("/").at(-1)}`
    : null;
  const rows = {
    capture: { id: capture.id, userId: owner, audioPath } as OwnedCaptureForDeletion | null,
    items: [...capture.items],
    tags: capture.items.flatMap((item) => [...item.emotions, ...item.topics]),
    audio: new Set(audioPath ? [audioPath] : []),
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

class MemoryPreviewStorage implements PreviewStorage {
  value: string | null = null;
  failWrites = false;
  getItem() { return this.value; }
  setItem(_key: string, value: string) {
    if (this.failWrites) throw new Error("blocked");
    this.value = value;
  }
}

test("capture persistence is explicit for mapped remote, new local, and seed captures", () => {
  assert.equal(capturePersistence(asRemoteCapture(fixture())), "remote");
  assert.equal(capturePersistence(asLocalCapture(fixture("text"))), "local");
  assert.ok(seedCaptures().every((capture) => capturePersistence(capture) === "local"));
  assert.equal(capturePersistence({ ...fixture(), audioPath: "local:capture-1" }), "local");
  assert.throws(
    () => capturePersistence({ ...fixture("text"), persistenceSource: undefined }),
    /capture_persistence_unknown/,
  );
});

test("local voice deletion removes audio and metadata without calling remote", async () => {
  const local = asLocalCapture({ ...fixture("voice"), audioPath: "local:capture-1" });
  const remote = asRemoteCapture({ ...fixture("text"), id: "remote-1" });
  const storage = new MemoryPreviewStorage();
  storage.value = JSON.stringify([local]);
  let remoteCalls = 0;
  let audioCalls = 0;
  await deleteCaptureFromPersistence(local, {
    deleteRemote: async () => { remoteCalls += 1; },
    deleteLocalAudio: async () => { audioCalls += 1; },
    deleteLocalMetadata: (id) => {
      deleteLocalCaptureMetadata(storage, [local, remote], id);
    },
  });
  assert.equal(remoteCalls, 0);
  assert.equal(audioCalls, 1);
  assert.deepEqual(readPreviewCaptures(storage), []);
  assert.equal(storage.value?.includes("remote-1"), false);
});

test("missing local voice audio does not block metadata deletion", async () => {
  const local = asLocalCapture({ ...fixture("voice"), audioPath: "local:capture-1" });
  const storage = new MemoryPreviewStorage();
  storage.value = JSON.stringify([local]);
  await deleteCaptureFromPersistence(local, {
    deleteRemote: async () => assert.fail("remote deletion must not run"),
    deleteLocalAudio: async () => {},
    deleteLocalMetadata: (id) => { deleteLocalCaptureMetadata(storage, [local], id); },
  });
  assert.deepEqual(readPreviewCaptures(storage), []);
});

test("local text deletion skips audio and removes persisted metadata", async () => {
  const local = asLocalCapture(fixture("text"));
  const storage = new MemoryPreviewStorage();
  storage.value = JSON.stringify([local]);
  let audioCalls = 0;
  await deleteCaptureFromPersistence(local, {
    deleteRemote: async () => assert.fail("remote deletion must not run"),
    deleteLocalAudio: async () => { audioCalls += 1; },
    deleteLocalMetadata: (id) => { deleteLocalCaptureMetadata(storage, [local], id); },
  });
  assert.equal(audioCalls, 0);
  assert.deepEqual(readPreviewCaptures(storage), []);
});

test("failed local metadata persistence rejects without changing application captures", async () => {
  const local = asLocalCapture(fixture("text"));
  const captures = [local];
  const storage = new MemoryPreviewStorage();
  storage.value = JSON.stringify(captures);
  storage.failWrites = true;
  await assert.rejects(() => deleteCaptureFromPersistence(local, {
    deleteRemote: async () => assert.fail("remote deletion must not run"),
    deleteLocalAudio: async () => {},
    deleteLocalMetadata: (id) => { deleteLocalCaptureMetadata(storage, captures, id); },
  }), /local_capture_metadata_delete_failed/);
  assert.deepEqual(captures, [local]);
});

test("remote persistence routes only to the existing server deletion dependency", async () => {
  const remote = asRemoteCapture(fixture());
  const calls: string[] = [];
  await deleteCaptureFromPersistence(remote, {
    deleteRemote: async (id) => { calls.push(id); },
    deleteLocalAudio: async () => assert.fail("local audio deletion must not run"),
    deleteLocalMetadata: () => assert.fail("local metadata deletion must not run"),
  });
  assert.deepEqual(calls, [remote.id]);
});

test("signed anonymous-session owner can delete its persisted capture ID", async () => {
  const { adapter, rows } = memoryAdapter(fixture("voice"), "anonymous-user-uuid");
  await permanentlyDeleteOwnedCapture("capture-1", "anonymous-user-uuid", adapter);
  assert.equal(rows.capture, null);
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

test("missing Storage audio does not block database cascades", async () => {
  const { adapter, rows } = memoryAdapter(fixture("voice"));
  adapter.removeAudio = async () => {
    throw { statusCode: 404, code: "not_found" };
  };
  await permanentlyDeleteOwnedCapture("capture-1", "user-1", adapter);
  assert.equal(rows.capture, null);
  assert.deepEqual(rows.items, []);
  assert.deepEqual(rows.tags, []);
  assert.equal(isMissingStorageObject({ status: 404 }), true);
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

test("deleting another capture preserves unrelated player state", () => {
  const result = deletionStateAfterSuccess([fixture()], "capture-1", "capture-2");
  assert.equal(result.closePlayer, false);
});

test("portalled confirmation layering clears the visible global player", () => {
  assert.ok(DELETE_CONFIRMATION_Z_INDEX > GLOBAL_PLAYER_Z_INDEX);
  assert.equal(DELETE_CONFIRMATION_Z_INDEX, PHONE_OVERLAY_Z_INDEX);
});

test("modal targets the clipped in-phone overlay and never the document body", () => {
  let queried = "";
  const host = {} as Element;
  const result = findPhoneOverlayHost({
    querySelector(selector: string) {
      queried = selector;
      return host;
    },
  });
  assert.equal(queried, PHONE_OVERLAY_SELECTOR);
  assert.equal(result, host);

  const detailSource = readFileSync("components/screens/Detail.tsx", "utf8");
  const frameSource = readFileSync("components/PhoneFrame.tsx", "utf8");
  assert.doesNotMatch(detailSource, /document\.body/);
  assert.match(detailSource, /position:absolute;inset:0/);
  assert.doesNotMatch(detailSource, /position:fixed/);
  assert.match(frameSource, /data-phone-overlay-host="1"/);
  assert.match(frameSource, /overflow:hidden;border-radius:inherit;pointer-events:none/);
});

test("failed deletion keeps the destructive action labelled Delete", () => {
  assert.equal(DELETE_ACTION_LABEL, "Delete");
  assert.notEqual(DELETE_ACTION_LABEL, "Retry delete");
});
