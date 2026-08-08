import type { BackgroundContext } from "./types";

/** Local demo content only. Nothing here represents a connected account. */
export const demoBackgroundContext: BackgroundContext[] = [
  {
    id: "calendar-board-review",
    source: "Calendar event",
    title: "Board review",
    detail: "Today, 3:00–4:00 PM · Quarterly runway and hiring plan",
  },
  {
    id: "personal-sleep-note",
    source: "Personal note",
    title: "Sleep has been uneven",
    detail: "Woke up around 4 AM three times this week before important meetings.",
  },
  {
    id: "work-launch-note",
    source: "Work note",
    title: "Launch decision",
    detail: "The team needs a go or no-go decision on Friday. Two key fixes are still open.",
  },
  {
    id: "support-boundaries-note",
    source: "Support-session note",
    title: "Notice the urge to over-explain",
    detail: "Reflection from the last session: pause before taking responsibility for everything.",
  },
];
