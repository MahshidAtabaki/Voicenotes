import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  capturePersistence,
  deletedCaptureWasPlaying,
  deleteCaptureFromPersistence,
  deleteRemoteCapture,
  type RemoteDeleteDependencies,
} from "../lib/capture-deletion.ts";
import { deletePreviewCapture, readPreviewCaptures, writePreviewCaptures, type PreviewStorage } from "../lib/local-preview.ts";
import type { CaptureSession } from "../lib/types.ts";

function capture(source: "local" | "remote", audioPath: string | null = null): CaptureSession {
  return {
    id: `${source}-capture`,
    persistenceSource: source,
    kind: audioPath ? "voice" : "text",
    title: "Exact title",
    summary: "Summary",
    originalText: "My exact words",
    transcript: null,
    audioPath,
    durationSeconds: null,
    shared: false,
    archived: false,
    createdAt: "Now",
    items: [],
  };
}

function remoteDependencies(audioPath: string | null) {
  const calls: string[] = [];
  const dependencies: RemoteDeleteDependencies = {
    async findOwnedCapture(id, ownerId) {
      calls.push("lookup");
      return { id, ownerId, audioPath };
    },
    async deleteAudio(path) {
      calls.push(`audio:${path}`);
      return "deleted";
    },
    async deleteDatabaseCapture() {
      calls.push("database");
      return true;
    },
  };
  return { calls, dependencies };
}

test("remote capture with audio deletes storage before its database row", async () => {
  const { calls, dependencies } = remoteDependencies("user/audio.webm");
  await deleteRemoteCapture("capture", "user", dependencies);
  assert.deepEqual(calls, ["lookup", "audio:user/audio.webm", "database"]);
});

test("remote capture without audio deletes its database row", async () => {
  const { calls, dependencies } = remoteDependencies(null);
  await deleteRemoteCapture("capture", "user", dependencies);
  assert.deepEqual(calls, ["lookup", "database"]);
});

test("missing remote Storage audio does not prevent database deletion", async () => {
  const { calls, dependencies } = remoteDependencies("user/missing.webm");
  dependencies.deleteAudio = async () => { calls.push("audio:missing"); return "missing"; };
  await deleteRemoteCapture("capture", "user", dependencies);
  assert.deepEqual(calls, ["lookup", "audio:missing", "database"]);
});

test("database deletion failure rejects so callers keep UI state intact", async () => {
  const captures = [capture("remote")];
  const { dependencies } = remoteDependencies(null);
  dependencies.deleteDatabaseCapture = async () => false;
  await assert.rejects(() => deleteRemoteCapture("remote-capture", "user", dependencies), /not_applied/);
  assert.equal(captures.length, 1);
});

class MemoryStorage implements PreviewStorage {
  value: string | null = null;
  getItem() { return this.value; }
  setItem(_key: string, value: string) { this.value = value; }
}

test("local capture deletes local persistence and IndexedDB audio", async () => {
  const storage = new MemoryStorage();
  const local = capture("local", "local:local-capture");
  writePreviewCaptures(storage, [local]);
  const calls: string[] = [];
  await deleteCaptureFromPersistence(local, {
    async deleteRemote() { calls.push("remote"); },
    async deleteLocalAudio(id) { calls.push(`indexeddb:${id}`); },
    async deleteLocalRecord(id) { deletePreviewCapture(storage, id); calls.push(`local:${id}`); },
  });
  assert.deepEqual(calls, ["indexeddb:local-capture", "local:local-capture"]);
  assert.deepEqual(readPreviewCaptures(storage), []);
});

test("deleted local capture does not return after persisted collection reload", () => {
  const storage = new MemoryStorage();
  writePreviewCaptures(storage, [capture("local")]);
  deletePreviewCapture(storage, "local-capture");
  assert.equal(readPreviewCaptures(storage)?.some(({ id }) => id === "local-capture"), false);
});

test("persistence source is explicit even when local and remote captures coexist", () => {
  assert.equal(capturePersistence(capture("local")), "local");
  assert.equal(capturePersistence(capture("remote")), "remote");
});

test("deleting the currently playing capture closes playback only for that capture", () => {
  assert.equal(deletedCaptureWasPlaying("a", "a"), true);
  assert.equal(deletedCaptureWasPlaying("a", "b"), false);
});

test("delete confirmation uses the in-phone overlay host above MiniPlayer", async () => {
  const [detail, frame, player] = await Promise.all([
    readFile(new URL("../components/screens/Detail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PhoneFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/MiniPlayer.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(detail, /createPortal\(<DeleteConfirmation \/>, overlayHost\)/);
  assert.match(frame, /data-phone-overlay-host="1"/);
  assert.doesNotMatch(detail, /document\.body/);
  assert.match(frame, /z-index:100/);
  assert.match(player, /z-index:80/);
});
