import { useVC } from "@/lib/store";
import type { CaptureSession, LibraryFilter } from "@/lib/types";
import { css } from "../css";
import { fmtDur, shareChip } from "./shared";

const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "private", label: "Private" },
  { id: "shared", label: "Shared" },
  { id: "anxious", label: "Anxious" },
  { id: "lonely", label: "Lonely" },
  { id: "archived", label: "Archived" },
];

function captureTags(c: CaptureSession): string[] {
  const tags = new Set<string>();
  for (const it of c.items) {
    for (const e of it.emotions) tags.add(e.label);
    for (const t of it.topics) tags.add(t);
  }
  return [...tags];
}

export function Library() {
  const vc = useVC();
  const q = vc.search.trim().toLowerCase();

  let caps = vc.captures.filter((c) => {
    if (vc.filter === "archived") return c.archived;
    if (c.archived) return false;
    if (vc.filter === "private" && c.shared) return false;
    if (vc.filter === "shared" && !c.shared) return false;
    if (
      (vc.filter === "anxious" || vc.filter === "lonely") &&
      !captureTags(c).includes(vc.filter)
    ) {
      return false;
    }
    if (q) {
      const hay = (
        c.title +
        " " +
        c.summary +
        " " +
        captureTags(c).join(" ")
      ).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (vc.sort === "oldest") caps = [...caps].reverse();

  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;overflow-y:auto;padding:64px 0 108px",
      )}
    >
      <div style={css("padding:10px 22px 4px")}>
        <h1 style={css("font-size:30px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0")}>
          History
        </h1>
      </div>
      <div style={css("padding:14px 22px 6px")}>
        <div style={css("display:flex;align-items:center;gap:9px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:22px;padding:10px 16px")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#8e8e93" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={vc.search}
            onChange={(e) => vc.setSearch(e.currentTarget.value)}
            placeholder="Search your thoughts"
            style={css(
              "border:none;background:none;outline:none;font-size:16px;color:#1d1d1f;width:100%;letter-spacing:-.2px",
            )}
          />
        </div>
      </div>
      <div className="vc-scroll" style={css("display:flex;gap:8px;overflow-x:auto;padding:8px 22px 6px")}>
        {FILTERS.map((f) => {
          const active = vc.filter === f.id;
          return (
            <button
              key={f.id}
              className="vc-press"
              onClick={() => vc.setFilter(f.id)}
              style={{
                ...css(
                  "flex:none;border-radius:20px;padding:8px 15px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap",
                ),
                border: active ? "1px solid #1d1d1f" : "1px solid rgba(0,0,0,.1)",
                background: active ? "#1d1d1f" : "#fff",
                color: active ? "#fff" : "#1d1d1f",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <div style={css("padding:8px 22px 0")}>
        {caps.length > 0 ? (
          caps.map((c) => <CaptureCard key={c.id} c={c} onOpen={() => vc.openDetail(c.id)} />)
        ) : (
          <div style={css("text-align:center;padding:60px 20px;color:#8e8e93")}>
            <div style={css("font-size:44px;margin-bottom:12px")}>🔍</div>
            <div style={css("font-size:17px;font-weight:600;color:#1d1d1f;margin-bottom:6px")}>
              No captures found
            </div>
            <div style={css("font-size:15px")}>Try a different search or filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CaptureCard({ c, onOpen }: { c: CaptureSession; onOpen: () => void }) {
  const chip = shareChip(c.shared);
  const tags = captureTags(c).slice(0, 3);
  const multi = c.items.length > 1;
  return (
    <button
      className="vc-press"
      onClick={onOpen}
      style={css(
        "display:block;width:100%;text-align:left;border:none;background:#fff;border-radius:20px;padding:16px 18px;margin-bottom:12px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.05)",
      )}
    >
      <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:7px")}>
        <span style={css("font-size:12px;color:#8e8e93;letter-spacing:-.1px")}>
          {c.createdAt}
          {c.durationSeconds != null ? ` · ${fmtDur(c.durationSeconds)}` : ""}
        </span>
        <span
          style={{
            ...css("font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px"),
            color: chip.ink,
            background: chip.bg,
          }}
        >
          {chip.label}
        </span>
      </div>
      <div style={css("font-size:18px;font-weight:600;letter-spacing:-.3px;color:#1d1d1f;margin-bottom:4px")}>
        {c.title}
      </div>
      <div style={css("font-size:14px;line-height:1.45;color:#6e6e73;margin-bottom:10px")}>
        {c.summary}
      </div>
      <div style={css("display:flex;flex-wrap:wrap;gap:6px;align-items:center")}>
        {tags.map((t) => (
          <span key={t} style={css("font-size:12px;color:#0066cc;background:#eef4fd;padding:3px 9px;border-radius:14px")}>
            {t}
          </span>
        ))}
        {multi && (
          <span style={css("margin-left:auto;font-size:12px;font-weight:600;color:#0066cc;display:flex;align-items:center;gap:4px")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            {c.items.length}
          </span>
        )}
      </div>
    </button>
  );
}
