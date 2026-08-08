/* ============================================================
   Voice Capture — shared domain & AI contract types
   ============================================================ */

/** Content type a generated topic can take. */
export type ContentType =
  | "thought"
  | "emotion"
  | "experience"
  | "question"
  | "mixed";

/** How a capture originated. */
export type CaptureKind = "voice" | "text";

/**
 * Application state machine (the 11 canonical states).
 * Drives the UI exactly as the design specifies.
 */
export type AppStatus =
  | "idle"
  | "requesting_microphone"
  | "recording"
  | "paused"
  | "uploading"
  | "transcribing"
  | "organising"
  | "reviewing"
  | "saving"
  | "saved"
  | "failed";

export type Screen =
  | "signin"
  | "home"
  | "capture"
  | "review"
  | "saved"
  | "library"
  | "detail"
  | "therapist"
  | "settings";

export type InputMode = "voice" | "text";

/** User-selected external context. Always kept separate from their own words. */
export interface BackgroundContext {
  id: string;
  source: "Calendar event" | "Personal note" | "Work note" | "Support-session note";
  title: string;
  detail: string;
}

/* ---------- AI contract (the invariant) ----------
   For every generated topic, OpenAI must return exactly these fields.
   `sourceText` must exactly match part of the original input at the
   given character range — validated server-side. */
export interface OrganizedTopic {
  order: number;
  sourceText: string;
  startCharacter: number;
  endCharacter: number;
  generatedTitle: string;
  generatedSummary: string;
  type: ContentType;
  suggestedEmotions: string[];
  suggestedTopics: string[];
}

export interface OrganizeResult {
  topics: OrganizedTopic[];
  /** True when validation failed twice and the whole input was returned as one item. */
  fallback: boolean;
}

/* ---------- Review UI models (editable) ---------- */
export interface EmotionTag {
  label: string;
  /** Optional confidence label, e.g. "82%". */
  pct?: string;
  confirmed: boolean;
}

export interface ReviewItem {
  id: string;
  order: number;
  type: ContentType;
  /** Original words — never rewritten. */
  sourceText: string;
  startCharacter: number;
  endCharacter: number;
  /** Generated (editable) fields, stored separately from the original. */
  title: string;
  summary: string;
  emotions: EmotionTag[];
  topics: string[];
}

/* ---------- Persistence models ---------- */
export interface ThoughtItem {
  id: string;
  sessionId: string;
  order: number;
  type: ContentType;
  sourceText: string;
  startCharacter: number;
  endCharacter: number;
  title: string;
  summary: string;
  emotions: EmotionTag[];
  topics: string[];
  shared: boolean;
}

export interface CaptureSession {
  id: string;
  kind: CaptureKind;
  title: string;
  summary: string;
  /** Original submitted text (for text captures) — kept exactly. */
  originalText: string | null;
  /** Full preserved transcript (for voice captures) — kept exactly. */
  transcript: string | null;
  /** Storage path of the private audio object (voice captures). */
  audioPath: string | null;
  durationSeconds: number | null;
  shared: boolean;
  archived: boolean;
  createdAt: string;
  items: ThoughtItem[];
  /** Application metadata; omitted by older local records and database rows. */
  persistenceSource?: "local" | "remote";
}

/* ---------- Create payloads (client → server) ---------- */
export interface CreateItemInput {
  order: number;
  type: ContentType;
  sourceText: string;
  startCharacter: number;
  endCharacter: number;
  title: string;
  summary: string;
  shared: boolean;
  emotions: { label: string; confirmed: boolean }[];
  topics: string[];
}
export interface CreateCaptureInput {
  kind: CaptureKind;
  title: string;
  summary: string;
  originalText: string | null;
  transcript: string | null;
  audioPath: string | null;
  durationSeconds: number | null;
  shared: boolean;
  items: CreateItemInput[];
}

/* ---------- Library view helpers ---------- */
export type LibraryFilter =
  | "all"
  | "private"
  | "shared"
  | "anxious"
  | "lonely"
  | "archived";

export type LibrarySort = "recent" | "oldest";
