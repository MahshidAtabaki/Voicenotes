import { useVC } from "@/lib/store";
import { css } from "../css";

export function Settings() {
  const vc = useVC();
  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;overflow-y:auto;padding:64px 0 108px",
      )}
    >
      <div style={css("padding:10px 22px 8px")}>
        <h1 style={css("font-size:30px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0")}>
          Settings
        </h1>
      </div>
      <div style={css("padding:8px 22px 0")}>
        <div style={css("display:flex;align-items:center;gap:14px;background:#fff;border-radius:18px;padding:16px;margin-bottom:20px")}>
          <div style={css("flex:none;width:48px;height:48px;border-radius:50%;background:#0066cc;display:flex;align-items:center;justify-content:center;color:#fff;font-size:19px;font-weight:600")}>
            MC
          </div>
          <div>
            <div style={css("font-size:17px;font-weight:600;color:#1d1d1f;letter-spacing:-.2px")}>
              Maya Chen
            </div>
            <div style={css("font-size:14px;color:#8e8e93")}>maya@demo · Founder</div>
          </div>
        </div>

        <div style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#8e8e93;padding:0 4px 8px")}>
          Privacy
        </div>
        <div style={css("background:#fff;border-radius:18px;padding:4px 16px;margin-bottom:20px")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)")}>
            <div style={css("padding-right:14px")}>
              <div style={css("font-size:16px;font-weight:500;color:#1d1d1f;letter-spacing:-.2px")}>
                Captures are private by default
              </div>
              <div style={css("font-size:13px;color:#8e8e93;margin-top:2px")}>
                Nothing is shared with a therapist unless you choose it, item by item.
              </div>
            </div>
            <div style={css("flex:none;width:52px;height:32px;border-radius:20px;background:#34c759;position:relative;opacity:.6")}>
              <span style={css("position:absolute;top:3px;left:23px;width:26px;height:26px;border-radius:50%;background:#fff")} />
            </div>
          </div>
          <button
            className="vc-press"
            onClick={vc.goTherapist}
            style={css(
              "display:flex;align-items:center;justify-content:space-between;width:100%;padding:15px 0;border:none;background:none;cursor:pointer;text-align:left",
            )}
          >
            <span style={css("font-size:16px;font-weight:500;color:#1d1d1f;letter-spacing:-.2px")}>
              Preview therapist view
            </span>
            <span style={css("color:#c7c7cc;font-size:20px")}>›</span>
          </button>
        </div>

        <div style={css("font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#8e8e93;padding:0 4px 8px")}>
          Voice
        </div>
        <div style={css("background:#fff;border-radius:18px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between")}>
          <div style={css("padding-right:14px")}>
            <div style={css("font-size:16px;font-weight:500;color:#1d1d1f;letter-spacing:-.2px")}>
              Spoken prompts
            </div>
            <div style={css("font-size:13px;color:#8e8e93;margin-top:2px")}>
              Short voice guidance during capture. Everything is also on-screen.
            </div>
          </div>
          <button
            className="vc-press"
            onClick={vc.toggleMute}
            style={{
              ...css(
                "flex:none;width:52px;height:32px;border-radius:20px;border:none;position:relative;cursor:pointer;transition:background .25s",
              ),
              background: vc.muted ? "rgba(120,120,128,.32)" : "#34c759",
            }}
          >
            <span
              style={{
                ...css(
                  "position:absolute;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .25s cubic-bezier(.2,.8,.2,1)",
                ),
                left: vc.muted ? "3px" : "23px",
              }}
            />
          </button>
        </div>

        <div style={css("background:#fbf3ee;border:1px solid #f0e0d4;border-radius:18px;padding:16px;margin-bottom:20px")}>
          <div style={css("font-size:14px;font-weight:600;color:#9a5b2c;margin-bottom:4px")}>
            A note on safety
          </div>
          <div style={css("font-size:13px;line-height:1.5;color:#8a6a52")}>
            This app helps you preserve what happens between sessions. It is not a
            replacement for therapy or emergency support, and it does not diagnose. If
            you&apos;re in crisis, contact your local emergency services.
          </div>
        </div>
        <button
          className="vc-press"
          onClick={vc.signOut}
          style={css(
            "width:100%;height:50px;border:1px solid rgba(0,0,0,.12);border-radius:15px;background:#fff;color:#ff3b30;font-size:16px;font-weight:500;cursor:pointer",
          )}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
