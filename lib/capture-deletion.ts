import type { CaptureSession } from "./types";

export class CaptureNotFoundError extends Error {
  constructor() {
    super("Capture not found for this user");
    this.name = "CaptureNotFoundError";
  }
}

export interface OwnedCaptureForDeletion {
  id: string;
  userId: string;
  audioPath: string | null;
}

export interface CaptureDeletionAdapter {
  findOwnedCapture: (captureId: string, userId: string) => Promise<OwnedCaptureForDeletion | null>;
  removeAudio: (audioPath: string) => Promise<void>;
  deleteDatabaseCapture: (captureId: string, userId: string) => Promise<boolean>;
}

export function isMissingStorageObject(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: number; statusCode?: number | string; code?: string };
  return (
    value.status === 404 ||
    String(value.statusCode) === "404" ||
    value.code === "not_found" ||
    value.code === "NoSuchKey"
  );
}

/**
 * Permanently deletes an owned capture. Database foreign keys cascade through
 * organised items and tags; Storage must be removed explicitly first.
 */
export async function permanentlyDeleteOwnedCapture(
  captureId: string,
  userId: string,
  adapter: CaptureDeletionAdapter,
): Promise<void> {
  const capture = await adapter.findOwnedCapture(captureId, userId);
  if (!capture) throw new CaptureNotFoundError();

  if (capture.audioPath) {
    // Enforce the ownership namespace in application code as well as through
    // the bucket's RLS policy before removing an object.
    if (!capture.audioPath.startsWith(`${userId}/`)) {
      throw new Error("Capture audio path is outside the owner's namespace");
    }
    try {
      await adapter.removeAudio(capture.audioPath);
    } catch (error) {
      // A previously removed object is already in the desired state and must
      // not prevent the owned database records from being deleted.
      if (!isMissingStorageObject(error)) throw error;
    }
  }

  const deleted = await adapter.deleteDatabaseCapture(captureId, userId);
  if (!deleted) throw new Error("Database did not confirm capture deletion");
}

export function deletionStateAfterSuccess(
  captures: CaptureSession[],
  captureId: string,
  playingCaptureId: string | null,
) {
  return {
    captures: captures.filter((capture) => capture.id !== captureId),
    closePlayer: playingCaptureId === captureId,
  };
}
