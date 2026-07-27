# Voice Capture

A mobile-first web app that lets you capture what you're feeling — by voice or
text — and organises your words into distinct thoughts. **The AI organises but
never rewrites**: your original audio, transcript, and text are always preserved
and stored separately from any generated titles, summaries, or tags.

Built from the approved **Voice Capture** design prototype (`Voice Capture.dc.html`),
which is the source of truth for UI, copy, navigation, states, responsive
behaviour, and motion.

## Product and agent context

The repository carries the product context needed by human and AI contributors:

- [`AGENTS.md`](AGENTS.md) — mandatory repository guidance and invariants
- [`docs/product-brief.md`](docs/product-brief.md) — user, problem, value,
  therapist relationship, MVP scope, and non-goals
- [`docs/design-principles.md`](docs/design-principles.md) — Apple-inspired
  interaction, motion, capture, review, navigation, and playback principles
- [`docs/ai-behaviour.md`](docs/ai-behaviour.md) — original-word preservation,
  semantic titles, tags, multi-topic separation, validation, and fallback
- [`docs/architecture.md`](docs/architecture.md) — current system, providers,
  sessions, persistence modes, routes, failures, and verification

New coding-agent sessions should read `AGENTS.md` before making changes. Product
documentation explains the intended experience; architecture documentation
records what the current MVP actually implements.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Motion for React** and the design's own keyframes
- **Supabase** — Auth, Postgres, private Storage, Row Level Security
- **OpenAI** — organises input into validated topics (server-only)
- **ElevenLabs** — Scribe v2 speech-to-text + text-to-speech (server-only)
- **Zod** for server-side validation; **node:test** for unit tests

## How it works

1. **Capture** — record real audio (MediaRecorder + Web Audio; the circular
   waveform is driven by live microphone amplitude) or type text. Pause, resume,
   cancel, finish. Audio is preserved until upload succeeds.
2. **Transcribe** (voice) — audio is uploaded to a private Storage bucket and
   transcribed by ElevenLabs Scribe v2. The transcript is kept **verbatim**.
3. **Organise** — the transcript or text is sent through one shared OpenAI
   route that returns genuinely distinct topics, each with an exact
   `sourceText` character range, a generated title/summary, a content type, and
   suggested emotion/topic tags. The range is validated server-side; invalid
   output is retried once, then falls back to the whole input as a single item.
4. **Review** — edit generated metadata, confirm tags; originals stay untouched.
5. **Save** — persisted to Supabase under Row Level Security when a Supabase user
   session exists. Without one, metadata and audio remain private on the current
   browser and device through localStorage and IndexedDB. Sharing is explicit
   and per-item.
6. **Manage** — search, filter, reopen, edit, archive, delete. Deleting a voice
   capture also removes its stored audio.

### The AI invariant

For every generated topic the organiser returns:

```
order, sourceText, startCharacter, endCharacter,
generatedTitle, generatedSummary, type,
suggestedEmotions, suggestedTopics
```

`sourceText` must be an exact substring of the original input at
`[startCharacter, endCharacter)`. This is enforced in `lib/organize.ts` and
verified by the test suite. Originals and generated fields are stored in
separate columns.

### Application states

`idle · requesting_microphone · recording · paused · uploading · transcribing ·
organising · reviewing · saving · saved · failed` — microphone, upload,
transcription, AI, and database errors are all retryable, and audio is
preserved so a failed step never requires re-recording.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

Without any credentials the app still runs in **demo mode**: text/voice capture,
the real waveform, review, and local library all work, using a deterministic
offline organiser. Add keys to enable the real integrations.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase | Publishable/anon key (browser) |
| `SUPABASE_SECRET_KEY` | Supabase | Service-role key — **server only** |
| `OPENAI_API_KEY` | OpenAI | Server-only |
| `ELEVENLABS_API_KEY` | ElevenLabs | Server-only |

Legacy names are also accepted: `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Optional overrides: `OPENAI_MODEL`,
`ELEVENLABS_STT_MODEL`, `ELEVENLABS_TTS_VOICE_ID`, `ELEVENLABS_TTS_MODEL`.

All provider secrets are used server-side only and are never exposed to the
browser, logs, or the repository.

### Supabase setup

1. Apply the migration in `supabase/migrations/0001_init.sql` (via the Supabase
   SQL editor or the Supabase CLI). It creates the schema, RLS policies, the
   private `voice-captures` bucket, and triggers.
2. Enable **Anonymous sign-ins** in Supabase Auth (used by the demo account
   button). Add email/OAuth providers as needed.

## Scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm start           # run the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # node:test unit tests (AI invariant)
```

## Deploy to Vercel

1. Import the repository into Vercel (framework preset: **Next.js**, detected
   automatically — no extra config needed).
2. Add the environment variables above in **Project → Settings → Environment
   Variables**. Keep `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, and
   `ELEVENLABS_API_KEY` server-side (do not prefix them with `NEXT_PUBLIC_`).
3. Deploy. The API routes run on the Node.js runtime.

## Project structure

```
app/                  Next.js routes + API (organize, transcribe, tts, captures, items)
components/           PhoneFrame, screens, nav, toast (the ported design)
lib/                  store (state machine), organize (AI invariant), ai, elevenlabs,
                      supabase (client/server/repo), data/auth, tts, types
supabase/migrations/  schema + RLS + storage + triggers
test/                 unit tests for the AI invariant
proxy.ts              Supabase session refresh (Next 16 proxy convention)
```
