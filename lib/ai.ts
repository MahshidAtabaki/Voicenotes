import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import {
  heuristicOrganize,
  validateTopics,
  wholeInputTopic,
} from "./organize";
import type { CaptureKind, OrganizeResult, OrganizedTopic } from "./types";

/* ============================================================
   Server-only organiser. Secrets never leave this module.
   Enforces the AI invariant: the model organises but never rewrites.
   ============================================================ */

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const CONTENT_TYPES = [
  "thought",
  "emotion",
  "experience",
  "question",
  "mixed",
] as const;

const TopicSchema = z.object({
  order: z.number().int(),
  sourceText: z.string(),
  startCharacter: z.number().int(),
  endCharacter: z.number().int(),
  generatedTitle: z.string(),
  generatedSummary: z.string(),
  type: z.enum(CONTENT_TYPES),
  suggestedEmotions: z.array(z.string()),
  suggestedTopics: z.array(z.string()),
});
const ResponseSchema = z.object({ topics: z.array(TopicSchema) });

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    topics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          order: { type: "integer" },
          sourceText: { type: "string" },
          startCharacter: { type: "integer" },
          endCharacter: { type: "integer" },
          generatedTitle: { type: "string" },
          generatedSummary: { type: "string" },
          type: { type: "string", enum: CONTENT_TYPES as unknown as string[] },
          suggestedEmotions: { type: "array", items: { type: "string" } },
          suggestedTopics: { type: "array", items: { type: "string" } },
        },
        required: [
          "order",
          "sourceText",
          "startCharacter",
          "endCharacter",
          "generatedTitle",
          "generatedSummary",
          "type",
          "suggestedEmotions",
          "suggestedTopics",
        ],
      },
    },
  },
  required: ["topics"],
} as const;

const SYSTEM_PROMPT = `You organise a person's own words into distinct thoughts. You NEVER rewrite, paraphrase, correct, translate, or invent their words.

Rules:
- Separate the input ONLY into genuinely distinct subjects. Do not split every sentence. If it is really one subject, return exactly one topic.
- For each topic, "sourceText" MUST be copied verbatim as a contiguous substring of the original input — identical characters, punctuation and spacing. "startCharacter" and "endCharacter" are the 0-based [start, end) indices of that substring in the original input.
- "generatedTitle" (max ~6 words) and "generatedSummary" (one factual sentence) are your organisation — never put the user's rewritten words there.
- "type" is one of: thought, emotion, experience, question, mixed.
- "suggestedEmotions" and "suggestedTopics" are short lowercase tags (0–3 each).
- Do NOT diagnose the person. Do NOT invent context that is not present. Do NOT give advice.`;

function buildUserPrompt(input: string, kind: CaptureKind): string {
  const label =
    kind === "text" ? "the text the person wrote" : "a transcript of what the person said";
  return `Here is ${label}. Organise it following the rules. Return JSON only.\n\nORIGINAL INPUT (organise verbatim, indices are into this exact string):\n"""\n${input}\n"""`;
}

/** Recompute indices from the verbatim sourceText so a valid substring is honoured
    even if the model mis-numbered the range. Returns null if not a real substring. */
function repairIndices(input: string, topics: OrganizedTopic[]): OrganizedTopic[] | null {
  const repaired: OrganizedTopic[] = [];
  for (const t of topics) {
    const text = typeof t.sourceText === "string" ? t.sourceText : "";
    if (!text) return null;
    let start = input.indexOf(text, Math.max(0, t.startCharacter || 0));
    if (start < 0) start = input.indexOf(text);
    if (start < 0) return null;
    repaired.push({ ...t, startCharacter: start, endCharacter: start + text.length });
  }
  return repaired;
}

async function callModel(
  client: OpenAI,
  input: string,
  kind: CaptureKind,
): Promise<OrganizedTopic[] | null> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input, kind) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "organized_thoughts", strict: true, schema: JSON_SCHEMA },
    },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = ResponseSchema.safeParse(parsed);
  if (!result.success) return null;
  return result.data.topics;
}

/**
 * Organise input into validated topics.
 * - No key configured → deterministic offline organiser (still valid contract).
 * - With key → model call, validate against the invariant, retry once, then
 *   fall back to returning the whole input as a single item.
 */
export async function organizeServer(
  input: string,
  kind: CaptureKind,
): Promise<OrganizeResult> {
  const trimmed = input.trim();
  if (!trimmed) return { topics: [], fallback: true };

  const key = process.env.OPENAI_API_KEY;
  if (!key) return heuristicOrganize(input);

  const client = new OpenAI({ apiKey: key });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const topics = await callModel(client, input, kind);
      if (topics) {
        const repaired = repairIndices(input, topics);
        if (repaired) {
          const valid = validateTopics(input, repaired);
          if (valid) return { topics: valid, fallback: false };
        }
      }
    } catch {
      /* transient error — the retry loop will try once more */
    }
  }

  // Retry failed twice → return the complete original input as one item.
  return wholeInputTopic(input);
}
