import { z } from "zod";

const contentType = z.enum(["thought", "emotion", "experience", "question", "mixed"]);
const item = z.object({
  order: z.number().int().min(0).max(100), type: contentType,
  sourceText: z.string().min(1).max(20_000),
  startCharacter: z.number().int().min(0), endCharacter: z.number().int().positive(),
  title: z.string().trim().min(1).max(200), summary: z.string().trim().min(1).max(2_000),
  shared: z.boolean(),
  emotions: z.array(z.object({ label: z.string().trim().min(1).max(50), confirmed: z.boolean() })).max(20),
  topics: z.array(z.string().trim().min(1).max(50)).max(20),
});

export const captureSchema = z.object({
  kind: z.enum(["voice", "text"]), title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2_000), originalText: z.string().max(20_000).nullable(),
  transcript: z.string().max(20_000).nullable(), audioPath: z.string().max(500).nullable(),
  durationSeconds: z.number().int().min(0).max(86_400).nullable(), shared: z.boolean(),
  items: z.array(item).min(1).max(100),
}).superRefine((value, ctx) => {
  const source = value.kind === "voice" ? value.transcript : value.originalText;
  if (source == null || (value.kind === "voice" ? value.originalText !== null : value.transcript !== null)) {
    ctx.addIssue({ code: "custom", message: "capture source does not match kind" }); return;
  }
  if (value.kind === "voice" && !value.audioPath?.trim())
    ctx.addIssue({ code: "custom", path: ["audioPath"], message: "persisted voice captures require audio" });
  if (value.kind === "text" && value.audioPath !== null)
    ctx.addIssue({ code: "custom", path: ["audioPath"], message: "text captures cannot contain audio" });
  for (const [index, it] of value.items.entries()) {
    if (it.endCharacter > source.length || source.slice(it.startCharacter, it.endCharacter) !== it.sourceText)
      ctx.addIssue({ code: "custom", path: ["items", index, "sourceText"], message: "sourceText must exactly match its character range" });
  }
});

export function validateCapturePayload(value: unknown) { return captureSchema.safeParse(value); }
