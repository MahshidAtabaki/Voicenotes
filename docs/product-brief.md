# Product brief

## Product idea

VoiceNotes is a private, voice-first space where founders capture thoughts,
emotions, questions, and therapist-assigned reflections as they happen, then use
AI to organise them for later review or an optional support conversation.

## Primary user

The primary user is a founder, startup builder, or early-stage operator who is
dealing with stress, emotional overload, burnout, loneliness, uncertainty, or
mental strain while building a company.

Founders are the focus because their mental state directly affects focus,
judgement, energy, relationships, decision-making, and performance. They often
move quickly between work and personal pressure, and may not have time or
emotional capacity to structure what they are experiencing.

## Problem space

This product does not provide therapy. It helps a person preserve and organise
what is happening in their mind so they can understand it later, follow through
on support work, and communicate more accurately with a therapist or another
trusted professional.

Voice is an interface for the problem, not the product's value by itself. It is
useful because it is fast, natural, and accessible when the user is emotional,
tired, walking, or too overwhelmed to type.

## Usability research insight: ask less, understand more

A usability participant said they valued capturing moments between support
sessions, but did not want to reconstruct the full context every time they
recorded. Repeating background information felt effortful and could make them
soften or simplify what they really felt.

They expected the product, with clear permission, to make better use of context
they had already created elsewhere, such as calendar events, personal notes, or
notes from support conversations. The goal is not to infer private facts
silently. It is to reduce repeated explanation and help the founder express how
they feel while keeping them in control of what context is used.

Product implication: when choosing future features, prefer ways to bring in or
suggest relevant existing context with explicit consent, instead of asking the
founder to restate everything from scratch.

## Two core problems

### 1. Important thoughts disappear before support conversations

Thoughts, feelings, questions, and incidents arise throughout the week, not only
during therapy. Details fade quickly. By the time the founder speaks to someone,
they may remember only a vague version and lose the context that made the moment
important.

Typing can feel too slow or effortful when emotions are strong. The founder may
know something matters without being able to organise it into a clean note.

### 2. Therapist assignments are difficult to complete and recall

A therapist may ask the founder to notice a pattern, answer a reflection
question, practise a coping exercise, or record how an assignment affected them.
Busy or overwhelmed users may forget the assignment, postpone it, or lose the
result before the next session.

The product should let the founder record an assignment response or result in
their own words. AI may organise and tag the capture, but must not evaluate the
person, diagnose them, or claim the assignment was completed unless the user
actually says so.

## Why solving this matters

The product should help the user:

- release a thought before it disappears;
- feel less alone with unstructured pressure;
- recognise patterns across captures;
- remember what to discuss in a support conversation;
- follow through on therapist-assigned reflection or coping work;
- get more value from limited therapy or support time.

The intended outcome is clearer reflection and better continuity between
moments, assignments, and support conversations.

## Founder and therapist relationship

The founder owns the capture and controls sharing.

The future therapist experience may show:

- captures the founder explicitly shared;
- the founder's exact words for those shared items;
- AI-generated titles, summaries, and relevant tags;
- assignment responses or results the founder chose to share;
- the date and context of the shared capture.

The therapist experience must not automatically receive:

- private captures;
- unconfirmed AI interpretations;
- raw audio without explicit consent;
- diagnoses, risk scores, or clinical conclusions invented by AI.

The current MVP does not build the complete therapist product. The existing
therapist screen demonstrates that the two experiences can be connected and
that only explicitly shared items should appear.

## MVP scope

The founder-facing MVP includes:

- voice recording from the browser;
- typed capture through a chat-style composer;
- audio transcription;
- preservation of original audio, transcript, and typed text;
- semantic organisation into one or more distinct capture items;
- generated titles, summaries, content types, and tags;
- editable review before saving;
- private-by-default saving;
- local device persistence without visible login;
- Supabase persistence when an authenticated Supabase session exists;
- history, search, filtering, archive, delete, and audio playback;
- a read-only therapist-connection demonstration.

## Non-goals

The MVP must not:

- present itself as therapy or a therapist;
- diagnose mental-health conditions;
- provide crisis intervention;
- change, clean up, or rewrite the user's words;
- share captures automatically;
- infer clinical meaning not stated in the capture;
- build a complete therapist dashboard, assignment-authoring system, billing
  system, or clinical record system.

## Success principles

Success is not measured by how much AI text the product generates. A successful
capture means:

1. the user's original meaning is preserved;
2. the generated organisation is genuinely useful;
3. distinct subjects are separated correctly;
4. the user can correct generated metadata;
5. saving and playback are dependable;
6. privacy and sharing remain understandable and under the user's control.
