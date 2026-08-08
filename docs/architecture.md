# Architecture

## System overview

VoiceNotes is a mobile-first Next.js web application deployed on Vercel.

```text
Browser capture
  -> voice transcription when applicable
  -> semantic organisation
  -> editable review
  -> local or Supabase persistence
  -> history, detail, sharing, and playback
```

The browser preserves the original input throughout the pipeline. Provider
responses create metadata and never replace the source.

## Technology stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Motion for React and project keyframes
- OpenAI for semantic organisation and secondary transcription
- ElevenLabs Scribe v2 for primary speech-to-text
- ElevenLabs text-to-speech for approved fixed prompts
- Supabase Auth, Postgres, private Storage, and Row Level Security
- localStorage for local capture metadata
- IndexedDB for local audio blobs
- Zod for validation
- `node:test` for unit tests
- Vercel for hosting and server-side API routes

## Capture pipeline

### Voice

1. The browser requests microphone permission.
2. `MediaRecorder` records the real audio blob.
3. Web Audio amplitude drives the circular waveform.
4. The user may pause, resume, cancel, or finish.
5. The browser posts the audio to `/api/transcribe`.
6. The server tries ElevenLabs Scribe v2 first.
7. If ElevenLabs fails, the server tries OpenAI transcription.
8. The verbatim transcript is sent to `/api/organize`.
9. The user reviews generated items and metadata.
10. On save, the app persists remotely when a valid Supabase user exists,
    otherwise it saves metadata and audio locally.

The current transcription route is batch-based. It does not provide genuine
streaming transcription during recording. Never simulate a live transcript.

### Text

1. The user types in the bottom composer.
2. The exact text is sent to `/api/organize`.
3. The server returns validated organised topics.
4. The user reviews and saves using the same persistence path as voice.

### Optional background (demo UI)

The capture composer includes an optional, explicit background picker with local
demo examples for calendar, personal notes, work notes, and support-session
notes. These examples do not represent connected accounts and are never imported
automatically. Selected background remains visually and structurally separate
from recorded or typed source words, and the user can remove it at any time.

The current implementation is an interaction demonstration: selected background
is not sent to the organiser or persisted with a saved capture. A production
integration requires an explicit source-connection and consent model, a separate
validated context payload and persistence schema, and clear revocation behaviour.

Text processing states and copy must never refer to a recording or voice.

## AI organisation

`app/api/organize/route.ts` calls the server-only organiser in `lib/ai.ts`.

The organiser:

- uses strict structured output;
- understands the complete input before labelling;
- separates genuinely distinct subjects;
- returns exact source substrings and character ranges;
- generates title, summary, type, emotions, and topics;
- retries once when output is invalid;
- falls back safely to one item containing the original input.

`lib/organize.ts` and `lib/validation.ts` enforce the source-text and payload
invariants. See `docs/ai-behaviour.md`.

## Sessions and API protection

The MVP must not show a login gate.

Paid organisation and transcription routes use a signed, HttpOnly, same-site
private-session cookie created server-side. The session is rate-limited and does
not expose provider credentials to the browser.

Authenticated Supabase user identity is still required for remote database and
private Storage operations. These are separate concerns:

- signed private session: authorises controlled use of paid AI routes;
- Supabase user session: owns remotely stored captures and audio.

Never assume that access to an AI route means the browser has a Supabase user.

## Persistence modes

### Supabase mode

When Supabase is configured and the browser has a valid Supabase user:

- audio uploads to the private `voice-captures` bucket;
- captures and organised items persist in Postgres;
- Row Level Security restricts records to their owner;
- playback uses a short-lived signed URL;
- delete removes capture data and associated audio.

Permanent deletion is performed by the authenticated server route. The route
first verifies that the capture belongs to the current Supabase user, explicitly
removes any audio object from the private `voice-captures` bucket, and only then
deletes the owned `capture_sessions` row after requiring the database to return
the deleted ID. Storage deletion uses the same server-side, cookie-bound user
session and the bucket's owner-only delete policy; it does not require or expose
a service-role key. An already-missing audio object is treated as deleted.
Existing foreign keys cascade the database deletion through
`thought_items` and `thought_tags`. Text captures follow the same database path
without a Storage operation. A failed or unconfirmed operation remains retryable
and must not be reflected as a successful client-side deletion.

### No-login local mode

When there is no valid Supabase browser session:

- capture metadata is stored in localStorage;
- audio blobs are stored in IndexedDB;
- audio paths use a local identifier;
- local captures are restored after reload on the same browser and device.

Local mode is not cross-device storage and is not a therapist-sharing backend.
Do not describe local persistence as cloud backup.

Every capture in application state carries a normalised `persistenceSource` of
`local` or `remote`. Supabase-mapped captures are remote; new local captures,
demo seeds, and legacy preview records are local. Deletion routes on that field:
remote captures use the authenticated server endpoint, while local captures
remove IndexedDB audio when applicable and then persist only the remaining local
captures to `voicenotes.previewCaptures`. Remote captures are never written into
that local metadata store. React state changes only after the selected
persistence layer confirms deletion.

## Therapist connection

`components/screens/Therapist.tsx` is a read-only demonstration, not a complete
therapist application.

It shows only items explicitly marked as shared and does not show audio. A future
therapist product would require its own authenticated role, data-access model,
consent rules, assignment entities, audit behaviour, and clinical/privacy review.
Do not expand the demonstration into a production therapist portal without an
explicit product and security decision.

## Audio playback

Saved local audio is loaded from IndexedDB. Supabase audio is loaded through a
server-generated signed URL. `MiniPlayer` owns persistent playback controls so
the recording remains controllable across screens.

Only one recording may play at a time. Stop and release temporary object URLs
when playback closes or the source changes.

## Server routes

- `POST /api/transcribe` validates and transcribes real audio.
- `POST /api/organize` returns validated semantic organisation.
- `POST /api/tts` synthesises approved fixed prompts only.
- `GET/POST /api/captures` lists or creates remote captures.
- `GET/PATCH/DELETE /api/captures/[id]` manages a remote capture.
- `GET /api/captures/[id]/audio` returns an authorised signed audio URL.
- `PATCH /api/items/[id]` edits metadata or explicit sharing.

## Environment variables

Public browser configuration:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Server-only secrets:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ELEVENLABS_API_KEY
```

Optional provider configuration:

```text
OPENAI_MODEL
ELEVENLABS_STT_MODEL
ELEVENLABS_TTS_VOICE_ID
ELEVENLABS_TTS_MODEL
```

Never prefix provider secrets or Supabase service-role credentials with
`NEXT_PUBLIC_`.

## Failure behaviour

- Microphone denial must lead to a clear text alternative.
- Recording, transcription, organisation, upload, save, and playback failures
  must be distinguishable and retryable.
- Preserve real audio until the operation succeeds or the user explicitly
  discards it.
- Do not report a successful save until the selected persistence layer confirms
  it.
- Do not substitute sample words when transcription fails.
- Avoid leaking provider messages, secrets, or internal stack traces.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

For changes to the capture pipeline, also verify:

- text capture and text-specific loading copy;
- microphone permission, record, pause, resume, cancel, and finish;
- real waveform response;
- transcription and honest failure behaviour;
- one-topic and multi-topic organisation;
- exact preservation of source words;
- local save, reload, playback, archive, and delete;
- Supabase save and signed playback when an authenticated test user is available;
- persistent mini-player controls across navigation.
