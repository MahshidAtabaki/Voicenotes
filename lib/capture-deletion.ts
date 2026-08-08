import type { CaptureSession } from "./types";

export type CapturePersistence = "local" | "remote";

export function capturePersistence(capture: CaptureSession): CapturePersistence {
  if (capture.persistenceSource) return capture.persistenceSource;
  // Backward compatibility for locally saved captures created before source
  // metadata was introduced. Remote rows are normalized by the API mapper.
  if (capture.audioPath?.startsWith("local:")) return "local";
  throw new Error("capture_persistence_unknown");
}

export interface DeleteCaptureDependencies {
  deleteRemote(id: string): Promise<void>;
  deleteLocalRecord(id: string): Promise<void>;
  deleteLocalAudio(id: string): Promise<void>;
}

export interface RemoteCaptureRecord {
  id: string;
  ownerId: string;
  audioPath: string | null;
}

export interface RemoteDeleteDependencies {
  findOwnedCapture(id: string, ownerId: string): Promise<RemoteCaptureRecord | null>;
  deleteAudio(path: string): Promise<"deleted" | "missing">;
  deleteDatabaseCapture(id: string, ownerId: string): Promise<boolean>;
}

export async function deleteRemoteCapture(
  id: string,
  ownerId: string,
  dependencies: RemoteDeleteDependencies,
): Promise<void> {
  const capture = await dependencies.findOwnedCapture(id, ownerId);
  if (!capture || capture.ownerId !== ownerId) throw new Error("capture_not_found_or_not_owned");
  if (capture.audioPath) await dependencies.deleteAudio(capture.audioPath);
  if (!(await dependencies.deleteDatabaseCapture(id, ownerId))) {
    throw new Error("capture_delete_not_applied");
  }
}

export function deletedCaptureWasPlaying(
  deletedCaptureId: string,
  playingCaptureId: string | null,
): boolean {
  return deletedCaptureId === playingCaptureId;
}

export async function deleteCaptureFromPersistence(
  capture: CaptureSession,
  dependencies: DeleteCaptureDependencies,
): Promise<CapturePersistence> {
  const source = capturePersistence(capture);
  if (source === "remote") {
    await dependencies.deleteRemote(capture.id);
    return source;
  }
  await dependencies.deleteLocalAudio(capture.id);
  await dependencies.deleteLocalRecord(capture.id);
  return source;
}
