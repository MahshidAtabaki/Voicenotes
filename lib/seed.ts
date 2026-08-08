import type { CaptureSession, ReviewItem } from "./types";

/* Seed data ported verbatim from the design prototype so the UI renders
   faithfully before a Supabase session exists (unauthenticated / demo). */

export function seedReviewItems(): ReviewItem[] {
  return [
    {
      id: "i1",
      order: 0,
      type: "experience",
      title: "Tension with my co-founder",
      summary:
        "A disagreement about the roadmap left things unresolved and tense.",
      sourceText:
        "Me and Dan got into it again about the roadmap. I don't think he heard what I was actually saying, and I left the call feeling like we're not on the same page at all.",
      startCharacter: 0,
      endCharacter: 0,
      emotions: [
        { label: "frustrated", pct: "82%", confirmed: false },
        { label: "hurt", pct: "61%", confirmed: false },
      ],
      topics: ["co-founder", "communication"],
    },
    {
      id: "i2",
      order: 1,
      type: "emotion",
      title: "Can't switch off at night",
      summary:
        "Difficulty sleeping, with the mind returning to work after lying down.",
      sourceText:
        "And I still can't sleep. I lie down and my brain just starts going through everything, all the things I didn't finish, and by the time I look up it's two in the morning.",
      startCharacter: 0,
      endCharacter: 0,
      emotions: [
        { label: "anxious", pct: "79%", confirmed: false },
        { label: "exhausted", pct: "70%", confirmed: false },
      ],
      topics: ["sleep", "stress"],
    },
    {
      id: "i3",
      order: 2,
      type: "thought",
      title: "Too many product decisions",
      summary:
        "Feeling overwhelmed by the number of product choices to make alone.",
      sourceText:
        "There are just so many product decisions right now and they all feel like they land on me. I keep second-guessing whether we're even building the right thing.",
      startCharacter: 0,
      endCharacter: 0,
      emotions: [{ label: "overwhelmed", pct: "84%", confirmed: false }],
      topics: ["product", "prioritisation"],
    },
  ];
}

export function seedCaptures(): CaptureSession[] {
  return [
    {
      id: "c_investor",
      persistenceSource: "local",
      kind: "voice",
      title: "Nerves before the investor meeting",
      summary: "Worried about tomorrow's pitch and whether the numbers hold up.",
      originalText: null,
      transcript:
        "I keep running the numbers in my head before tomorrow. What if they ask about churn and I freeze? I know the story but I'm scared it won't land.",
      audioPath: null,
      durationSeconds: 112,
      shared: false,
      archived: false,
      createdAt: "Yesterday, 8:14 PM",
      items: [
        {
          id: "c_investor_1",
          sessionId: "c_investor",
          order: 0,
          type: "emotion",
          sourceText:
            "I keep running the numbers in my head before tomorrow. What if they ask about churn and I freeze? I know the story but I'm scared it won't land.",
          startCharacter: 0,
          endCharacter: 0,
          title: "Nerves before the investor meeting",
          summary:
            "Anxiety about the upcoming investor pitch and fear of freezing on tough questions.",
          emotions: [{ label: "anxious", confirmed: true }],
          topics: ["fundraising"],
          shared: false,
        },
      ],
    },
    {
      id: "c_alone",
      persistenceSource: "local",
      kind: "voice",
      title: "Feeling alone leading the team",
      summary: "The isolation of being the one who has to hold it all together.",
      originalText: null,
      transcript:
        "Some days it feels like I'm the only one who can see the whole picture, and that's a lonely place to sit.",
      audioPath: null,
      durationSeconds: 150,
      shared: true,
      archived: false,
      createdAt: "Mon, 7:02 AM",
      items: [
        {
          id: "c_alone_1",
          sessionId: "c_alone",
          order: 0,
          type: "emotion",
          sourceText:
            "Some days it feels like I'm the only one who can see the whole picture, and that's a lonely place to sit.",
          startCharacter: 0,
          endCharacter: 0,
          title: "Feeling alone leading the team",
          summary:
            "Reflection on the isolation of leadership and carrying responsibility alone.",
          emotions: [{ label: "lonely", confirmed: true }],
          topics: ["leadership"],
          shared: true,
        },
      ],
    },
  ];
}

/** Demo transcript words, revealed progressively while recording (design parity). */
export function demoTranscriptWords(): string[] {
  return "Okay so — me and Dan got into it again about the roadmap. I don't think he heard what I was actually saying, and I left the call feeling like we're not on the same page. And honestly I still can't sleep. I lie down and my brain just starts going through everything. There are so many product decisions right now and they all feel like they land on me."
    .split(" ")
    .filter(Boolean);
}
