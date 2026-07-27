# AI behaviour

## Core promise

The AI organises the user's input. It never rewrites the user's original words.

Original audio, voice transcript, and typed text are source material. Generated
titles, summaries, types, and tags are metadata. They must remain separate in
the interface, application state, API contract, and database.

## Permitted AI actions

The AI may:

- identify genuinely distinct subjects within one input;
- assign each subject its exact contiguous source text;
- generate a short semantic title;
- generate one concise factual summary;
- classify the item as a thought, emotion, experience, question, or mixed;
- suggest specific emotional and subject tags;
- recognise that the user is describing a therapist assignment or its result
  when the user explicitly provides that context.

## Prohibited AI actions

The AI must not:

- rewrite, correct, clean up, translate, or paraphrase source text;
- replace the user's words with a more polished version;
- use the opening words as a title without understanding the full meaning;
- invent missing context, causes, people, events, or outcomes;
- diagnose the user or assign a clinical condition;
- provide therapy, treatment, or crisis advice as part of organisation;
- claim an assignment is complete unless the user said it was completed;
- expose private information to another user or therapist;
- present heuristic or sample output as if it came from the live model.

## Multi-topic separation

Create a separate item when the input moves to a genuinely different:

- concern;
- decision;
- project or company problem;
- relationship or person;
- emotional experience;
- therapist assignment or reflection;
- question.

Phrases such as “another thing,” “second,” “separately,” and “also” are useful
boundary signals, but they are not sufficient by themselves. Meaning determines
the split.

Keep supporting details with their subject. Do not fragment one coherent concern
into several small cards. Preserve the original order and cover every meaningful
part of the input.

## Source-text invariant

Every organised item must include:

```text
order
sourceText
startCharacter
endCharacter
generatedTitle
generatedSummary
type
suggestedEmotions
suggestedTopics
```

`sourceText` must be an exact contiguous substring of the original input at the
zero-based range `[startCharacter, endCharacter)`.

The server must validate this invariant. If the model returns the correct
verbatim text with incorrect indices, indices may be repaired. If the words do
not exist exactly in the input, reject the output.

## Semantic titles

A title should:

- be approximately three to seven words;
- name the central meaning of that item;
- distinguish it from the other items in the capture;
- avoid greetings, filler, and generic labels.

Example:

- Weak: `Hello I wanted to say`
- Weak: `My thoughts`
- Better: `Anxiety before the investor presentation`
- Better: `Difficulty building with Claude Code`
- Better: `Progress with the breathing exercise`

## Summaries

A summary should be one concise, factual sentence that captures the complete
point. Include emotional context only when it is stated or strongly evidenced.
Do not give advice or add an interpretation that the source cannot support.

## Tags

The UI presents one unified collection of useful tags. Internally, the model may
return:

- `suggestedEmotions`, for stated or strongly evidenced feelings;
- `suggestedTopics`, for meaningful subjects or patterns.

Good tags are specific, lowercase, and useful for later recall:

- `anxious`
- `proud`
- `burnout`
- `imposter syndrome`
- `investor presentation`
- `co-founder conflict`
- `breathing exercise`

Avoid generic or low-information tags such as `thought`, `thing`, `work`, or
`feeling` unless the context makes them meaningfully specific.

Do not over-medicalise ordinary feelings. A phrase such as “I feel like an
imposter” may support `imposter syndrome` as a user-facing pattern tag, but it
does not establish a diagnosis.

## Validation and fallback

1. Request strict structured output.
2. Validate the schema.
3. Repair only character indices when verbatim source text is valid.
4. Validate exact source ranges and field limits.
5. Retry the model once when validation fails.
6. If both attempts fail, return the whole original input as one item with safe
   generated metadata.
7. Never alter or discard the original input during fallback.

Fallback must remain visibly honest. Do not insert sample transcripts, invented
tags, or pretend a provider request succeeded.

## Editing and confirmation

The user may edit generated titles and summaries, remove suggested tags, and add
their own tags. Editing metadata must not modify original text or transcript.

Sharing is a separate explicit decision. Editing or accepting an AI suggestion
does not automatically share it with a therapist.
