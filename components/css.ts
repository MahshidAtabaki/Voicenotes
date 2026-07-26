import type { CSSProperties } from "react";

/**
 * Parse a CSS declaration string into a React style object.
 * Lets us port the design's inline styles verbatim (preserving exact values)
 * while interpolating dynamic bits with template literals.
 */
export function css(input: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of input.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const rawKey = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!rawKey || value === "") continue;
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = value;
  }
  return out as CSSProperties;
}
