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
    // The admin Storage client bypasses RLS, so enforce the ownership namespace
    // before it is ever allowed to remove an object.
    if (!capture.audioPath.startsWith(`${userId}/`)) {
      throw new Error("Capture audio path is outside the owner's namespace");
    }
    await adapter.removeAudio(capture.audioPath);
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
