import { createPortal } from "react-dom";
import { useVC } from "@/lib/store";
import { getPhoneOverlayHost } from "@/lib/delete-confirmation";
import type { ThoughtItem } from "@/lib/types";
import { css } from "../css";
import { fmtDur } from "./shared";

export function Detail() {
  const vc = useVC();
  const overlayHost =
    typeof document === "undefined" ? null : getPhoneOverlayHost(document);
  const c = vc.captures.find((x) => x.id === vc.detailId) ?? vc.captures[0];
  if (!c) {
    return (
      <div className="vc-back" style={css("position:absolute;inset:0;background:#f5f5f7")} />
    );
  }
  const isVoice = c.kind === "voice";
  const transcript =
    c.transcript ?? c.originalText ?? c.items.map((it) => it.sourceText).join(" ");
  const dur = fmtDur(c.durationSeconds);

  return (
    <div
      className="vc-back vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;overflow-y:auto;padding:56px 0 40px",
      )}
    >
      <div
        style={css(
          "position:sticky;top:0;z-index:20;background:rgba(245,245,247,.82);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);padding:8px 18px;display:flex;align-items:center;gap:6px",
        )}
      >
        <button
          className="vc-press"
          onClick={vc.backFromDetail}
          style={css(
            "display:flex;align-items:center;gap:2px;border:none;background:none;color:#0066cc;font-size:17px;cursor:pointer;padding:6px 4px",
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#0066cc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Captures
        </button>
        <button
          className="vc-press"
          onClick={vc.archiveCapture}
          style={css("margin-left:auto;border:none;background:none;color:#0066cc;font-size:15px;cursor:pointer;padding:6px 8px")}
        >
          Archive
        </button>
        <button
          className="vc-press"
          onClick={vc.deleteCapture}
          style={css("border:none;background:none;color:#ff3b30;font-size:15px;cursor:pointer;padding:6px 8px")}
        >
          Delete
        </button>
      </div>
      <div style={css("padding:10px 24px 4px")}>
        <div style={css("font-size:13px;color:#8e8e93;margin-bottom:6px")}>
          {c.createdAt}
          {dur ? ` · recorded ${dur}` : ""}
        </div>
        <input defaultValue={c.title} aria-label="Capture title" onBlur={(e) => vc.updateSavedField("title", e.currentTarget.value)} style={css("display:block;width:100%;font-size:26px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0 0 8px;border:none;background:transparent;outline:none")} />
        <textarea defaultValue={c.summary} aria-label="Capture summary" onBlur={(e) => vc.updateSavedField("summary", e.currentTarget.value)} style={css("display:block;width:100%;font:inherit;font-size:15px;line-height:1.45;color:#6e6e73;margin:0 0 14px;border:none;background:transparent;outline:none;resize:vertical")} />
        {isVoice && (
          <button
            className="vc-press"
            onClick={vc.playAudio}
            style={css(
              "display:inline-flex;align-items:center;gap:9px;border:none;background:#0066cc;color:#fff;border-radius:22px;padding:11px 20px;font-size:16px;font-weight:500;cursor:pointer",
            )}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play recording{dur ? ` · ${dur}` : ""}
          </button>
        )}
      </div>
      <div style={css("padding:20px 20px 0")}>
        <div style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#8e8e93;padding:0 4px 8px")}>
          {c.items.length} {c.items.length === 1 ? "thought" : "thoughts"} in this{" "}
          {isVoice ? "recording" : "note"}
        </div>
        {c.items.map((it) => (
          <DetailItem key={it.id} it={it} />
        ))}
        <div style={css("background:#fff;border-radius:20px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.05)")}>
          <div style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#8e8e93;margin-bottom:10px")}>
            {isVoice ? "Full original transcript" : "What you wrote"}
          </div>
          <p style={css("font-size:15px;line-height:1.65;color:#1d1d1f;margin:0")}>{transcript}</p>
        </div>
      </div>
      {vc.deleteConfirmationOpen && overlayHost
        ? createPortal(<DeleteConfirmation />, overlayHost)
        : null}
    </div>
  );
}

function DeleteConfirmation() {
  const vc = useVC();
  return (
    <div
      role="presentation"
      onClick={vc.cancelDeleteCapture}
      style={css(
        "position:absolute;inset:0;z-index:1;display:flex;align-items:flex-end;background:rgba(0,0,0,.48);pointer-events:auto",
      )}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-capture-title"
        aria-describedby="delete-capture-description"
        className="vc-sheet"
        onClick={(event) => event.stopPropagation()}
        style={css(
          "width:100%;background:#fff;border-radius:26px 26px 0 0;padding:12px 22px 30px;color:#1d1d1f;box-shadow:0 -12px 40px rgba(0,0,0,.18)",
        )}
      >
        <div style={css("width:40px;height:5px;border-radius:3px;background:rgba(0,0,0,.15);margin:0 auto 18px")} />
        <h2 id="delete-capture-title" style={css("font-size:20px;font-weight:600;letter-spacing:-.3px;margin:0 0 8px")}>
          Delete this capture?
        </h2>
        <p id="delete-capture-description" style={css("font-size:15px;line-height:1.5;color:#6e6e73;margin:0 0 20px")}>
          This permanently removes the capture, its organised thoughts, and its recording. This can’t be undone.
        </p>
        {vc.deleteError && (
          <p role="alert" style={css("font-size:14px;line-height:1.4;color:#c9342c;background:#fff0ef;border-radius:12px;padding:10px 12px;margin:0 0 12px")}>
            {vc.deleteError}
          </p>
        )}
        <button
          className="vc-press"
          onClick={vc.confirmDeleteCapture}
          disabled={vc.deleteInProgress}
          style={{
            ...css("width:100%;height:52px;border:none;border-radius:15px;background:#ff3b30;color:#fff;font-size:17px;font-weight:600;cursor:pointer;margin-bottom:10px"),
            opacity: vc.deleteInProgress ? 0.65 : 1,
          }}
        >
          {vc.deleteInProgress ? "Deleting…" : "Delete"}
        </button>
        <button
          className="vc-press"
          onClick={vc.cancelDeleteCapture}
          disabled={vc.deleteInProgress}
          style={css("width:100%;height:52px;border:none;border-radius:15px;background:#f0f0f2;color:#1d1d1f;font-size:17px;font-weight:600;cursor:pointer")}
        >
          Cancel
        </button>
      </section>
    </div>
  );
}

function DetailItem({ it }: { it: ThoughtItem }) {
  const vc = useVC();
  const chips = [
    ...it.emotions.map((e) => ({ label: e.label, ink: "#0066cc", bg: "#eef4fd" })),
    ...it.topics.map((t) => ({ label: t, ink: "#1d1d1f", bg: "#f0f0f2" })),
  ];
  return (
    <div style={css("background:#fff;border-radius:20px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)")}>
      <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px")}>
        <input defaultValue={it.title} aria-label="Item title" onBlur={(e) => vc.updateSavedItemField(it.id, "title", e.currentTarget.value)} style={css("width:70%;border:none;background:transparent;outline:none;font-size:18px;font-weight:600;letter-spacing:-.3px;color:#1d1d1f")} />
        <button
          className="vc-press"
          onClick={() => vc.toggleItemShare(it.id)}
          style={{
            ...css(
              "flex:none;display:flex;align-items:center;gap:6px;border-radius:16px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer",
            ),
            border: it.shared ? "1px solid #0066cc" : "1px solid rgba(0,0,0,.1)",
            background: it.shared ? "#eef4fd" : "#f0f0f2",
            color: it.shared ? "#0066cc" : "#8e8e93",
          }}
        >
          {it.shared ? "Shared" : "Private"}
        </button>
      </div>
      <div style={css("background:#f5f5f7;border-radius:14px;padding:12px 14px;margin-bottom:10px")}>
        <div style={css("font-size:11px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#1d1d1f;margin-bottom:6px")}>
          Your words
        </div>
        <p style={css("font-size:15px;line-height:1.55;color:#1d1d1f;margin:0")}>
          &ldquo;{it.sourceText}&rdquo;
        </p>
      </div>
      <div style={css("font-size:11px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#0066cc;margin-bottom:6px")}>
        Organised for you
      </div>
      <textarea defaultValue={it.summary} aria-label="Item summary" onBlur={(e) => vc.updateSavedItemField(it.id, "summary", e.currentTarget.value)} style={css("display:block;width:100%;border:none;background:transparent;outline:none;resize:vertical;font:inherit;font-size:15px;line-height:1.5;color:#6e6e73;margin:0 0 10px")} />
      <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
        {chips.map((ch) => (
          <span
            key={ch.label}
            style={{
              ...css("font-size:12px;padding:4px 10px;border-radius:14px"),
              color: ch.ink,
              background: ch.bg,
            }}
          >
            {ch.label}
          </span>
        ))}
      </div>
    </div>
  );
}
