"use client";

/* Spoken prompts via the server TTS route. Static prompts are cached as object
   URLs so each is only synthesized once. Silent when muted or unavailable. */

const cache = new Map<string, string>();
let current: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
}

export async function speak(prompt: "capture", muted: boolean): Promise<void> {
  if (muted || typeof window === "undefined") return;
  try {
    let url = cache.get(prompt);
    if (!url) {
      const res = await fetch(`/api/tts?prompt=${prompt}`);
      if (!res.ok) return; // not configured / failed — stay silent
      const blob = await res.blob();
      url = URL.createObjectURL(blob);
      cache.set(prompt, url);
    }
    stopSpeaking();
    current = new Audio(url);
    await current.play().catch(() => {});
  } catch {
    /* audio is a nicety — never block capture on it */
  }
}
