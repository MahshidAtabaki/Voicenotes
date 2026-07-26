import type {
  CaptureKind,
  ContentType,
  OrganizeResult,
  OrganizedTopic,
  ReviewItem,
} from "./types";

/* ============================================================
   Heuristic organiser — the AI invariant, enforced in pure code.

   Used as the deterministic fallback when no OPENAI_API_KEY is
   configured, and to validate/repair any model output. It NEVER
   rewrites the user's words: every topic's `sourceText` is an exact
   substring of the original input at [startCharacter, endCharacter).
   ============================================================ */

const EMOTION_LEXICON: Record<string, string> = {
  frustrat: "frustrated",
  angry: "angry",
  anxious: "anxious",
  anxiety: "anxious",
  scared: "scared",
  afraid: "scared",
  worried: "worried",
  worry: "worried",
  overwhelm: "overwhelmed",
  exhaust: "exhausted",
  tired: "tired",
  lonely: "lonely",
  alone: "lonely",
  sad: "sad",
  hurt: "hurt",
  happy: "happy",
  grateful: "grateful",
  hopeful: "hopeful",
  excited: "excited",
  guilty: "guilty",
  ashamed: "ashamed",
  stuck: "stuck",
  confused: "confused",
};

const STOPWORDS = new Set(
  "the a an and or but so i you he she it we they me my your our their this that these those of to in on at for with about is am are was were be been being do does did have has had will would can could just really very not no dont don't im i'm its it's what when where why how there here then than as if out up down over again feel feeling felt like".split(
    /\s+/,
  ),
);

/** Split text into genuinely distinct chunks (paragraph, else sentence clusters). */
function splitChunks(input: string): { text: string; start: number }[] {
  const trimmed = input.replace(/\s+$/g, "");
  if (!trimmed) return [];

  // Prefer explicit paragraph breaks.
  const paraRegex = /\n\s*\n/g;
  const paragraphs: { text: string; start: number }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(trimmed))) {
    paragraphs.push({ text: trimmed.slice(last, m.index), start: last });
    last = m.index + m[0].length;
  }
  paragraphs.push({ text: trimmed.slice(last), start: last });
  const realParas = paragraphs.filter((p) => p.text.trim().length > 0);
  if (realParas.length > 1) return realParas;

  // Otherwise group sentences; only split when there are several.
  const sentences: { text: string; start: number }[] = [];
  const sentRegex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
  let sm: RegExpExecArray | null;
  while ((sm = sentRegex.exec(trimmed))) {
    if (sm[0].trim()) sentences.push({ text: sm[0], start: sm.index });
  }
  if (sentences.length <= 2) return [{ text: trimmed, start: 0 }];

  // Cluster sentences into up to 3 groups (avoid splitting every sentence).
  const groups = Math.min(3, Math.ceil(sentences.length / 2));
  const per = Math.ceil(sentences.length / groups);
  const out: { text: string; start: number }[] = [];
  for (let i = 0; i < sentences.length; i += per) {
    const slice = sentences.slice(i, i + per);
    const start = slice[0].start;
    const lastS = slice[slice.length - 1];
    const end = lastS.start + lastS.text.length;
    out.push({ text: trimmed.slice(start, end), start });
  }
  return out;
}

function detectEmotions(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [stem, label] of Object.entries(EMOTION_LEXICON)) {
    if (lower.includes(stem) && !found.includes(label)) found.push(label);
  }
  return found.slice(0, 3);
}

function detectTopics(text: string): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const w = raw.replace(/[^a-z]/g, "");
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([w]) => w);
}

function detectType(text: string): ContentType {
  const t = text.toLowerCase();
  const hasQuestion = /\?/.test(text);
  const hasEmotion = detectEmotions(text).length > 0;
  const hasExperience = /\b(went|did|met|got|call|meeting|yesterday|today|said|told)\b/.test(
    t,
  );
  const signals = [hasQuestion, hasEmotion, hasExperience].filter(Boolean).length;
  if (signals > 1) return "mixed";
  if (hasQuestion) return "question";
  if (hasExperience) return "experience";
  if (hasEmotion) return "emotion";
  return "thought";
}

function titleFrom(text: string): string {
  const meaningful = text
    .trim()
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/^(hi|hello|hey)\b[\s,!.:-]*/i, "")
    .replace(
      /^(i|we)\s+(?:would like to|want to|wanted to|need to|was trying to|am trying to|was thinking|think|feel like)\s+/i,
      "",
    )
    .replace(/^(i|we)\s+(?:am|was|were|have|had)\s+/i, "");
  const firstIdea = meaningful.split(/[.!?;\n]/, 1)[0] || meaningful;
  const words = firstIdea.split(/\s+/);
  const short = words.slice(0, 6).join(" ").replace(/[.,;:!?]+$/, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function summaryFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= 140) return clean;
  return clean.slice(0, 137).replace(/\s+\S*$/, "") + "…";
}

/** Deterministic organiser producing the validated contract from real input. */
export function heuristicOrganize(input: string): OrganizeResult {
  const chunks = splitChunks(input);
  if (chunks.length === 0) {
    return { topics: [], fallback: true };
  }
  const topics: OrganizedTopic[] = chunks.map((c, i) => {
    const sourceText = c.text.trim();
    // Recompute exact range of the trimmed text within the original input.
    const startCharacter = input.indexOf(sourceText, c.start >= 0 ? c.start : 0);
    const start = startCharacter >= 0 ? startCharacter : input.indexOf(sourceText);
    return {
      order: i,
      sourceText,
      startCharacter: start,
      endCharacter: start + sourceText.length,
      generatedTitle: titleFrom(sourceText),
      generatedSummary: summaryFrom(sourceText),
      type: detectType(sourceText),
      suggestedEmotions: detectEmotions(sourceText),
      suggestedTopics: detectTopics(sourceText),
    };
  });
  return { topics, fallback: false };
}

/**
 * Validate model output against the invariant. Returns null if any topic's
 * sourceText is not an exact substring at the declared character range.
 */
export function validateTopics(
  input: string,
  topics: OrganizedTopic[],
): OrganizedTopic[] | null {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  for (const t of topics) {
    if (
      typeof t.sourceText !== "string" ||
      typeof t.startCharacter !== "number" ||
      typeof t.endCharacter !== "number" ||
      t.startCharacter < 0 ||
      t.endCharacter > input.length ||
      t.startCharacter >= t.endCharacter
    ) {
      return null;
    }
    if (input.slice(t.startCharacter, t.endCharacter) !== t.sourceText) {
      return null;
    }
  }
  return topics
    .slice()
    .sort((a, b) => a.startCharacter - b.startCharacter)
    .map((t, i) => ({ ...t, order: i }));
}

/** Whole input as a single item — the last-resort fallback after retry fails. */
export function wholeInputTopic(input: string): OrganizeResult {
  const sourceText = input.trim();
  const start = input.indexOf(sourceText);
  return {
    fallback: true,
    topics: [
      {
        order: 0,
        sourceText,
        startCharacter: start < 0 ? 0 : start,
        endCharacter: (start < 0 ? 0 : start) + sourceText.length,
        generatedTitle: titleFrom(sourceText),
        generatedSummary: summaryFrom(sourceText),
        type: detectType(sourceText),
        suggestedEmotions: detectEmotions(sourceText),
        suggestedTopics: detectTopics(sourceText),
      },
    ],
  };
}

/** Map the AI contract to editable review items for the UI. */
export function topicsToReviewItems(
  result: OrganizeResult,
  kind: CaptureKind,
): ReviewItem[] {
  return result.topics.map((t) => ({
    id: `it_${t.order}_${Math.random().toString(36).slice(2, 8)}`,
    order: t.order,
    type: t.type,
    sourceText: t.sourceText,
    startCharacter: t.startCharacter,
    endCharacter: t.endCharacter,
    title: t.generatedTitle,
    summary: t.generatedSummary,
    emotions: t.suggestedEmotions.map((label) => ({ label, confirmed: false })),
    topics: t.suggestedTopics,
    // kind is retained by the session, not the item; referenced for labelling.
    ...(kind ? {} : {}),
  }));
}
