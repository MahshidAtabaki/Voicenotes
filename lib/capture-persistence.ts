import type { CaptureSession } from "./types";
import {
  writePreviewCaptures,
  type PreviewStorage,
} from "./local-preview";

export type CapturePersistenceSource = "local" | "remote";

export function capturePersistence(capture: CaptureSession): CapturePersistenceSource {
  if (capture.persistenceSource) return capture.persistenceSource;
  if (capture.audioPath?.startsWith("local:")) return "local";
  throw new Error("capture_persistence_unknown");
}

export function asLocalCapture(capture: CaptureSession): CaptureSession {
  return { ...capture, persistenceSource: "local" };
}

export function asRemoteCapture(capture: CaptureSession): CaptureSession {
  return { ...capture, persistenceSource: "remote" };
}

export function deleteLocalCaptureMetadata(
  storage: PreviewStorage,
  allCurrentCaptures: CaptureSession[],
  captureId: string,
): CaptureSession[] {
  const localCaptures = allCurrentCaptures.filter(
    (capture) => capturePersistence(capture) === "local",
  );
  if (!localCaptures.some((capture) => capture.id === captureId)) {
    throw new Error("local_capture_not_found");
  }
  const remainingLocalCaptures = localCaptures.filter(
    (capture) => capture.id !== captureId,
  );
  if (!writePreviewCaptures(storage, remainingLocalCaptures)) {
    throw new Error("local_capture_metadata_delete_failed");
  }
  return remainingLocalCaptures;
}
