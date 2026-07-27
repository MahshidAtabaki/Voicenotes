# VoiceNotes agent guidance

This repository contains a voice-first mental-health capture product for founders.
Before planning or changing the product, read these files in order:

1. `README.md`
2. `docs/product-brief.md`
3. `docs/design-principles.md`
4. `docs/ai-behaviour.md`
5. `docs/architecture.md`

The documents describe both the intended product and the current implementation.
When they differ, preserve the intended experience, state the implementation gap,
and never simulate unavailable functionality with fake data.

## Product invariants

- The product helps founders capture thoughts and emotions between support or
  therapy conversations. It is not a therapist, diagnostic tool, crisis service,
  or replacement for professional care.
- Users can also record progress on assignments given by their therapist.
- A future therapist experience is connected to the founder experience, but it is
  not part of the functional MVP. The existing therapist screen is a read-only
  demonstration only.
- Nothing is shared by default. A therapist may see only items the founder
  explicitly shares. Never expose private captures or audio implicitly.
- The AI organises but never rewrites the user's original words. Original text,
  transcript, and audio must remain separate from generated metadata.
- Never display sample, invented, corrected, paraphrased, or fallback words as a
  real transcript.
- Generated titles must reflect meaning, not copy the first words. Tags must be
  specific and useful. Multiple genuinely distinct subjects must become separate
  capture items.
- AI-generated titles, summaries, types, and tags are editable suggestions.
- Preserve a pending recording through retryable transcription, organisation,
  upload, and database failures. Do not make users record again unnecessarily.

## Experience invariants

- Preserve the approved mobile-first interaction model and Apple-inspired motion.
- Motion communicates space and state. Prefer direct manipulation and highly
  damped springs that settle without decorative bounce.
- Do not add motion that delays capture, obscures status, or increases emotional
  load. Respect reduced-motion preferences.
- During voice capture, keep the circular waveform central and the transcript
  hidden by default. Do not use a large rectangular waveform card or decorative
  shadow.
- Do not add duplicate close, cancel, voice, or text controls. Voice and text
  belong to one bottom composer.
- Typed-input processing copy must refer to text, not voice.
- Multi-topic results use a tab bar above one review card, not a long vertical
  stack of cards.
- Audio playback uses one persistent mini-player with play, pause, seek, stop, and
  close controls. Playback must remain controllable when navigating between app
  screens.

## Engineering rules

- Keep provider secrets server-only. Never expose OpenAI, ElevenLabs, Supabase
  service-role, or signing secrets to the browser, logs, fixtures, or repository.
- Validate all AI output and capture payloads server-side.
- Keep exact `sourceText` ranges valid against the original input.
- Maintain the no-visible-login MVP. Paid AI routes use the signed private session
  described in `docs/architecture.md`.
- Save remotely only with a valid Supabase user session. Otherwise preserve
  capture metadata in localStorage and audio blobs in IndexedDB.
- Do not replace a failed live integration with sample content. Return an honest,
  retryable error.
- Keep changes scoped. Do not redesign approved screens while fixing behaviour.

## Required verification

For code changes, run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Also test the affected user path. For capture changes, verify text and voice
separately. For persistence changes, verify save, reload, playback, archive, and
delete in the applicable local or Supabase mode.

Work is complete only when the requested behaviour works, errors remain
recoverable, original words are preserved, tests pass, and documentation is
updated when product or architecture decisions change.
