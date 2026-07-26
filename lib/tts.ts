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

export async function speak(text: string, muted: boolean): Promise<void> {
  if (muted || typeof window === "undefined") return;
  try {
    let url = cache.get(text);
    if (!url) {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      if (!res.ok) return; // not configured / failed — stay silent
      const blob = await res.blob();
      url = URL.createObjectURL(blob);
      cache.set(text, url);
    }
    stopSpeaking();
    current = new Audio(url);
    await current.play().catch(() => {});
  } catch {
    /* audio is a nicety — never block capture on it */
  }
}
