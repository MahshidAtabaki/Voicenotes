import { useVC } from "@/lib/store";
import { css } from "../css";

/** Read-only therapist preview: only explicitly-shared items, never audio. */
export function Therapist() {
  const vc = useVC();
  const shared = vc.captures
    .filter((c) => !c.archived)
    .flatMap((c) =>
      c.items
        .filter((it) => it.shared)
        .map((it) => ({ ...it, when: c.createdAt })),
    );

  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#1d1d1f;overflow-y:auto;padding:56px 0 40px;color:#fff",
      )}
    >
      <div style={css("padding:8px 18px 0")}>
        <button
          className="vc-press"
          onClick={vc.backFromTherapist}
          style={css(
            "display:flex;align-items:center;gap:3px;border:none;background:none;color:#2997ff;font-size:17px;cursor:pointer;padding:6px 4px",
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="#2997ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      </div>
      <div style={css("padding:10px 24px 6px")}>
        <div style={css("display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#8e8e93;background:rgba(255,255,255,.06);padding:5px 11px;border-radius:16px;margin-bottom:16px")}>
          Read-only therapist view · demo
        </div>
        <h1 style={css("font-size:24px;font-weight:600;letter-spacing:-.4px;margin:0 0 4px")}>
          Shared by Maya Chen
        </h1>
        <p style={css("font-size:15px;color:#9a9aa2;margin:0")}>
          Only thoughts Maya explicitly shared appear here. Audio and private items are
          never included.
        </p>
      </div>
      <div style={css("padding:18px 20px 0")}>
        {shared.length === 0 ? (
          <div style={css("padding:40px 8px;color:#9a9aa2;font-size:15px")}>
            Nothing has been shared yet. Toggle sharing on a thought to make it visible
            here.
          </div>
        ) : (
          shared.map((it) => {
            const confirmed = it.emotions
              .filter((e) => e.confirmed)
              .map((e) => e.label)
              .concat(it.topics);
            return (
              <div key={it.id} style={css("background:#2a2a2c;border-radius:20px;padding:16px;margin-bottom:12px")}>
                <div style={css("font-size:12px;color:#8e8e93;margin-bottom:8px")}>{it.when}</div>
                <div style={css("font-size:19px;font-weight:600;letter-spacing:-.3px;margin-bottom:12px")}>
                  {it.title}
                </div>
                <div style={css("background:#1d1d1f;border-radius:14px;padding:12px 14px;margin-bottom:10px")}>
                  <div style={css("font-size:11px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;color:#c7c7cc;margin-bottom:6px")}>
                    Maya&apos;s words
                  </div>
                  <p style={css("font-size:15px;line-height:1.55;color:#fff;margin:0")}>
                    &ldquo;{it.sourceText}&rdquo;
                  </p>
                </div>
                <p style={css("font-size:14px;line-height:1.5;color:#9a9aa2;margin:0 0 10px")}>{it.summary}</p>
                <div style={css("display:flex;flex-wrap:wrap;gap:6px")}>
                  {confirmed.map((t) => (
                    <span key={t} style={css("font-size:12px;color:#2997ff;background:rgba(41,151,255,.14);padding:4px 10px;border-radius:14px")}>
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
