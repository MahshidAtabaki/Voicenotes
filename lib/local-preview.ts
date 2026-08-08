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
      ? (value as CaptureSession[]).map((capture) => ({
          ...capture,
          persistenceSource: "local" as const,
        }))
      : null;
  } catch {
    return null;
  }
}

export function deletePreviewCapture(
  storage: PreviewStorage,
  id: string,
): CaptureSession[] {
  const captures = readPreviewCaptures(storage) ?? [];
  const remaining = captures.filter((capture) => capture.id !== id);
  if (remaining.length === captures.length) throw new Error("local_capture_not_found");
  if (!writePreviewCaptures(storage, remaining)) throw new Error("local_capture_write_failed");
  return remaining;
}

export function writePreviewCaptures(storage: PreviewStorage, captures: CaptureSession[]): boolean {
  try {
    storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(captures));
    return true;
  } catch {
    return false;
  }
}
