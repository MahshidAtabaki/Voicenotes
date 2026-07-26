import { useVC } from "@/lib/store";
import { css } from "../css";

export function Saved() {
  const vc = useVC();
  const n = vc.items.length;
  const savedCountLabel = n > 1 ? `${n} thoughts` : "one thought";
  return (
    <div
      className="vc-screen"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 36px;text-align:center",
      )}
    >
      <div
        className="vc-stag"
        style={css(
          "width:88px;height:88px;border-radius:50%;background:#0066cc;display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 18px 40px -14px rgba(0,102,204,.5)",
        )}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1
        className="vc-stag"
        style={{
          ...css("font-size:28px;font-weight:600;letter-spacing:-.5px;color:#1d1d1f;margin:0 0 10px"),
          animationDelay: ".06s",
        }}
      >
        Your thought has been saved.
      </h1>
      <p
        className="vc-stag"
        style={{
          ...css("font-size:17px;line-height:1.5;color:#6e6e73;margin:0 0 40px"),
          animationDelay: ".12s",
        }}
      >
        Organised into {savedCountLabel}, safe and private.
      </p>
      <div
        className="vc-stag"
        style={{
          ...css("width:100%;display:flex;flex-direction:column;gap:12px"),
          animationDelay: ".18s",
        }}
      >
        <button
          className="vc-press"
          onClick={vc.captureAnother}
          style={css(
            "height:54px;border:none;border-radius:16px;background:#0066cc;color:#fff;font-size:18px;font-weight:600;letter-spacing:-.2px;cursor:pointer",
          )}
        >
          Capture another thought
        </button>
        <button
          className="vc-press"
          onClick={vc.viewSaved}
          style={css(
            "height:52px;border:1px solid rgba(0,0,0,.12);border-radius:15px;background:#fff;color:#1d1d1f;font-size:17px;font-weight:500;cursor:pointer",
          )}
        >
          View saved thought
        </button>
        <button
          className="vc-press"
          onClick={vc.goHome}
          style={css("height:44px;border:none;background:none;color:#8e8e93;font-size:16px;cursor:pointer")}
        >
          Return home
        </button>
      </div>
    </div>
  );
}
