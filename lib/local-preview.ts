import type { CaptureSession } from "./types";

export const PREVIEW_STORAGE_KEY = "voicenotes.previewCaptures";

export interface PreviewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readPreviewCaptures(storage: PreviewStorage): CaptureSession[] | null {
  try {
    const raw = storage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? (value as CaptureSession[]).map((capture) =>
          capture.persistenceSource
            ? capture
            : { ...capture, persistenceSource: "local" },
        )
      : null;
  } catch {
    return null;
  }
}

export function writePreviewCaptures(storage: PreviewStorage, captures: CaptureSession[]): boolean {
  try {
    storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(captures));
    return true;
  } catch {
    return false;
  }
}
