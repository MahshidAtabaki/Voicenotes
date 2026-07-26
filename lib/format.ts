/** Human-friendly timestamps for the capture cards (matches the design tone). */
export function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yest.toDateString();
  const withinWeek = now.getTime() - d.getTime() < 7 * 864e5;

  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  if (withinWeek) {
    const wd = d.toLocaleDateString(undefined, { weekday: "short" });
    return `${wd}, ${time}`;
  }
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
