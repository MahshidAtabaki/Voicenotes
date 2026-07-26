/** Shared presentational helpers for screens (ported from the design). */

export function shareChip(shared: boolean): {
  label: string;
  ink: string;
  bg: string;
} {
  return shared
    ? { label: "Shared", ink: "#0066cc", bg: "#eef4fd" }
    : { label: "Private", ink: "#8e8e93", bg: "#f0f0f2" };
}

export function fmtDur(secs: number | null | undefined): string {
  if (secs == null) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
