"use client";

import { useVC } from "@/lib/store";
import { css } from "./css";
import { fmtDur } from "./screens/shared";

export function MiniPlayer({ raised }: { raised: boolean }) {
  const vc = useVC();
  if (!vc.playerVisible) return null;

  const duration = Math.max(0, vc.playerDuration);
  const current = Math.min(vc.playerCurrent, duration || vc.playerCurrent);

  return (
    <aside
      aria-label="Recording player"
      style={{
        ...css(
          "position:absolute;left:12px;right:12px;z-index:80;background:rgba(250,250,252,.94);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:11px 12px 10px;box-shadow:0 10px 30px rgba(0,0,0,.16);transition:bottom .38s cubic-bezier(.2,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1)",
        ),
        bottom: raised ? "82px" : "14px",
      }}
    >
      <div style={css("display:flex;align-items:center;gap:10px")}>
        <button
          className="vc-press"
          onClick={vc.togglePlayback}
          aria-label={vc.playerPlaying ? "Pause recording" : "Play recording"}
          style={css(
            "flex:none;width:38px;height:38px;border:none;border-radius:50%;background:#0066cc;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer",
          )}
        >
          {vc.playerPlaying ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div style={css("min-width:0;flex:1")}>
          <div
            style={css(
              "font-size:13px;font-weight:600;color:#1d1d1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px",
            )}
          >
            {vc.playerTitle}
          </div>
          <input
            aria-label="Recording position"
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={current}
            onChange={(event) => vc.seekPlayback(Number(event.currentTarget.value))}
            style={css("display:block;width:100%;height:4px;accent-color:#0066cc;cursor:pointer")}
          />
          <div style={css("font-size:10px;color:#8e8e93;margin-top:3px")}>
            {fmtDur(current)} / {fmtDur(duration)}
          </div>
        </div>
        <button
          className="vc-press"
          onClick={vc.stopPlayback}
          aria-label="Stop recording"
          style={css(
            "flex:none;width:32px;height:32px;border:none;border-radius:50%;background:#e9e9eb;color:#1d1d1f;display:flex;align-items:center;justify-content:center;cursor:pointer",
          )}
        >
          <span style={css("width:10px;height:10px;border-radius:2px;background:#1d1d1f")} />
        </button>
        <button
          className="vc-press"
          onClick={vc.closePlayback}
          aria-label="Close player"
          style={css(
            "flex:none;width:32px;height:32px;border:none;border-radius:50%;background:#e9e9eb;color:#1d1d1f;font-size:18px;line-height:1;cursor:pointer",
          )}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
