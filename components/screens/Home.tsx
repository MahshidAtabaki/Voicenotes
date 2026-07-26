import { useVC } from "@/lib/store";
import type { CaptureSession } from "@/lib/types";
import { css } from "../css";
import { fmtDur, shareChip } from "./shared";

export function Home() {
  const vc = useVC();
  const recent = vc.captures.filter((c) => !c.archived).slice(0, 2);
  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#ffffff;overflow-y:auto;padding:70px 0 108px",
      )}
    >
      <div style={css("padding:14px 24px 4px")}>
        <h1 style={css("font-size:28px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0")}>
          Hey, Mahshid
        </h1>
      </div>

      <div
        style={css(
          "padding:28px 24px 8px;display:flex;flex-direction:column;align-items:center;text-align:center",
        )}
      >
        <button
          className="vc-press"
          onClick={(e) => vc.goCapture(e)}
          style={css(
            "position:relative;width:184px;height:184px;border:none;border-radius:50%;background:radial-gradient(circle at 50% 38%,#1f8bff,#0066cc 68%);cursor:pointer;box-shadow:0 24px 50px -16px rgba(0,102,204,.55);display:flex;align-items:center;justify-content:center",
          )}
        >
          <span
            className="vc-ring"
            style={css(
              "position:absolute;inset:0;border-radius:50%;border:2px solid #0066cc;animation:vcRingPulse 2.6s ease-out infinite",
            )}
          />
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" />
            <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 style={css("font-size:24px;font-weight:600;letter-spacing:-.4px;color:#1d1d1f;margin:26px 0 6px")}>
          Capture a thought
        </h2>
        <p style={css("font-size:17px;color:#6e6e73;margin:0;letter-spacing:-.2px")}>
          Talk freely. I&apos;ll organise it for you.
        </p>
      </div>

      <div style={css("padding:26px 24px 0")}>
        <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px")}>
          <h3 style={css("font-size:20px;font-weight:600;letter-spacing:-.3px;color:#1d1d1f;margin:0")}>
            Recent
          </h3>
          <a href="#" onClick={(e) => { e.preventDefault(); vc.goLibrary(); }} style={css("font-size:15px;color:#0066cc")}>
            All captures
          </a>
        </div>
        {recent.map((c) => (
          <RecentCard key={c.id} c={c} onOpen={() => vc.openDetail(c.id)} />
        ))}
      </div>
    </div>
  );
}

function RecentCard({ c, onOpen }: { c: CaptureSession; onOpen: () => void }) {
  const chip = shareChip(c.shared);
  const dur = c.durationSeconds != null ? fmtDur(c.durationSeconds) : "";
  const multi = c.items.length > 1;
  return (
    <button
      className="vc-press"
      onClick={onOpen}
      style={css(
        "display:block;width:100%;text-align:left;border:1px solid rgba(0,0,0,.08);background:#fff;border-radius:18px;padding:16px 18px;margin-bottom:12px;cursor:pointer",
      )}
    >
      <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:6px")}>
        <span style={css("font-size:12px;color:#8e8e93;letter-spacing:-.1px")}>
          {c.createdAt}
          {dur ? ` · ${dur}` : ""}
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
      <div style={css("font-size:17px;font-weight:600;letter-spacing:-.3px;color:#1d1d1f;margin-bottom:4px")}>
        {c.title}
      </div>
      <div style={css("font-size:14px;line-height:1.4;color:#6e6e73")}>{c.summary}</div>
      {multi && (
        <div
          style={css(
            "margin-top:10px;font-size:12px;font-weight:600;color:#0066cc;display:flex;align-items:center;gap:5px",
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          {c.items.length} thoughts organised
        </div>
      )}
    </button>
  );
}
