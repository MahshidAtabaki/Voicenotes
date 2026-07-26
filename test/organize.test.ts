import assert from "node:assert/strict";
import { test } from "node:test";
import {
  heuristicOrganize,
  validateTopics,
  wholeInputTopic,
} from "../lib/organize.ts";

test("every topic's sourceText matches its exact character range (invariant)", () => {
  const input =
    "Me and Dan got into it again about the roadmap.\n\nAnd I still can't sleep at night, my mind keeps racing.";
  const { topics } = heuristicOrganize(input);
  assert.ok(topics.length >= 1);
  for (const t of topics) {
    assert.equal(input.slice(t.startCharacter, t.endCharacter), t.sourceText);
  }
});

test("never rewrites: sourceText is always a substring of the original", () => {
  const input = "I'm anxious about the pitch. What if I freeze?";
  const { topics } = heuristicOrganize(input);
  for (const t of topics) {
    assert.ok(input.includes(t.sourceText));
    assert.notEqual(t.generatedTitle, ""); // organisation is separate from words
  }
});

test("does not split a single short subject into many items", () => {
  const input = "I had a good day today.";
  const { topics } = heuristicOrganize(input);
  assert.equal(topics.length, 1);
});

test("validateTopics rejects a tampered range", () => {
  const input = "hello world this is a test";
  const { topics } = heuristicOrganize(input);
  const tampered = topics.map((t) => ({ ...t, sourceText: "not in input" }));
  assert.equal(validateTopics(input, tampered), null);
});

test("validateTopics accepts a correct range and re-orders by position", () => {
  const input = "First thing here.\n\nSecond thing there.";
  const { topics } = heuristicOrganize(input);
  const valid = validateTopics(input, topics);
  assert.ok(valid);
  assert.equal(valid![0].order, 0);
});

test("wholeInputTopic returns the entire input as one valid item", () => {
  const input = "everything as one blob of text";
  const res = wholeInputTopic(input);
  assert.equal(res.fallback, true);
  assert.equal(res.topics.length, 1);
  assert.equal(
    input.slice(res.topics[0].startCharacter, res.topics[0].endCharacter),
    res.topics[0].sourceText,
  );
});
