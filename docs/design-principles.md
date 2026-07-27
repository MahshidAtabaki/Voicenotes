# Design and interaction principles

## Experience objective

Capturing a difficult thought should feel faster than opening a notes app and
less demanding than organising the thought manually. The interface should be
calm, direct, private, and physically understandable.

The approved mobile web design is the visual starting point. Changes should
improve clarity or reliability without turning functional fixes into redesigns.

## Apple-inspired motion philosophy

Motion communicates physical and spatial relationships.

- A sheet should emerge from and return to a clear source.
- A deeper view should move in a direction that communicates navigation depth.
- A recording control should respond immediately to the user's touch.
- Gesture velocity may influence movement, but standard interface elements
  should settle on the first approach without visible oscillation.
- Prefer highly damped spring motion over decorative bounce.
- Preserve continuity. Elements should appear to move between states rather than
  disappear and reappear without a spatial relationship.
- Motion must clarify state, hierarchy, or cause and effect. Remove it when it
  only adds spectacle.
- Respect `prefers-reduced-motion` and provide an equivalent non-motion state.

## Capture entry

- The primary action is a large, clear invitation to capture a thought or
  emotion.
- The system may ask, “What would you like to record?”
- Voice and text are two inputs within the same capture flow, not separate
  products.
- Avoid a permanent voice/text toggle at the top of the screen.
- Text entry uses a compact composer at the bottom, like a chat interface. It
  expands upward as the user types.

## Voice recording

- The circular waveform is the visual focus and responds to real microphone
  amplitude.
- Do not use a large rectangular waveform container.
- Do not add a decorative shadow. Use a quiet background colour to distinguish
  the recording surface.
- Keep the pause/resume control directly below the waveform.
- Use one clear cancel control associated with the composer or call-like
  controls. Do not duplicate it with an additional top-right close icon.
- Cancelling a voice recording discards the current recording only after the
  interaction makes that consequence clear, then returns the user to text
  capture.
- Finishing a recording moves forward to transcription and organisation.

### Transcript visibility

- Do not show transcript text by default while recording.
- A “Show transcript” action or downward reveal gesture may expose the
  transcript when real partial transcription is available.
- The current MVP uses batch transcription after recording. Until streaming
  transcription exists, explain that the transcript will appear after the user
  finishes. Never show fake words to imitate live transcription.
- Swiping or revealing transcript content must move with the gesture and settle
  predictably.

## Processing feedback

Feedback must match the input type.

- Voice: explain that the recording is being transcribed and organised.
- Text: explain that the text is being tagged and grouped into relevant topics.
- Never tell a text user that “your voice” is being processed.
- Preserve the submitted input while processing. A failed request must lead to
  an honest retry state, not lost input or sample output.

Suggested completion language may acknowledge:

> I captured that. Let me put it somewhere useful for you.

Avoid language that implies diagnosis, treatment, judgement, or certainty.

## Review and multi-topic captures

- When AI finds one subject, show one review card.
- When AI finds multiple distinct subjects, show a tab bar above one card.
- Tabs should be labelled clearly as capture 1, capture 2, and so on, with enough
  title context to distinguish them.
- Switching tabs should use a short directional transition that preserves
  spatial orientation.
- Do not render all capture cards in a long vertical stack.
- Keep the user's exact words visibly separate from generated metadata.
- Generated title and summary are editable.
- Present useful AI labels as one “Tags” group in the UI, even if the data model
  stores emotions and topics separately.
- Selected tags use a clear selected colour. Each tag may be removed with its
  close control, and the user may add another tag.
- Do not require the user to confirm a diagnosis or a clinical interpretation.

## Audio playback

- A saved recording must use one understandable audio controller.
- Provide play, pause, seek, stop, and close.
- When playback continues during navigation, show a persistent mini-player.
- There must never be several recordings playing at once.
- The player must always identify which capture is playing.
- Closing the player stops playback and releases temporary object URLs.
- Playback failure must identify that the recording is unavailable rather than
  silently doing nothing.

## Navigation

Primary mobile navigation:

- Home
- History
- Capture
- Settings

Capture is the prominent action. Review, saved confirmation, capture detail, and
the therapist demonstration are contextual screens reached from the primary
flow.

Navigation transitions should communicate:

- forward movement into capture or detail;
- backward movement to the previous context;
- modal separation for temporary decisions;
- continuity when a selected capture expands into its detail view.

## Visual and accessibility principles

- Prioritise readable type, strong contrast, generous touch targets, and clear
  status language.
- Do not rely on colour alone for selected, shared, failed, or recording states.
- Buttons and icon-only controls require accessible names.
- Keep destructive actions visually and spatially distinct.
- Support keyboard navigation where the mobile web platform allows it.
- Preserve focus through sheets, errors, and state changes.
- Avoid unnecessary cognitive load, especially during recording and failure.
