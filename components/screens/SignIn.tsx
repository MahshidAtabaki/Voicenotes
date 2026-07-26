import { useVC } from "@/lib/store";
import { css } from "../css";

export function SignIn() {
  const vc = useVC();
  return (
    <div
      className="vc-screen vc-scroll"
      style={css(
        "position:absolute;inset:0;background:#f5f5f7;overflow-y:auto;padding:120px 32px 40px;display:flex;flex-direction:column",
      )}
    >
      <div
        style={css(
          "width:64px;height:64px;border-radius:20px;background:#0066cc;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px -10px rgba(0,102,204,.5)",
        )}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h1
        style={css(
          "font-size:34px;font-weight:600;letter-spacing:-.6px;line-height:1.1;color:#1d1d1f;margin:36px 0 12px",
        )}
      >
        Between sessions,
        <br />
        your thoughts stay yours.
      </h1>
      <p
        style={css(
          "font-size:17px;line-height:1.5;color:#6e6e73;margin:0 0 auto;letter-spacing:-.2px",
        )}
      >
        Capture what you&apos;re feeling by voice. We organise your words — we never
        rewrite them.
      </p>
      <div style={css("display:flex;flex-direction:column;gap:12px;margin-top:40px")}>
        <button
          className="vc-press"
          onClick={vc.signIn}
          style={css(
            "height:52px;border:none;border-radius:14px;background:#0066cc;color:#fff;font-size:17px;font-weight:500;letter-spacing:-.2px;cursor:pointer",
          )}
        >
          Continue privately
        </button>
        <p
          style={css(
            "font-size:12px;line-height:1.4;color:#8e8e93;text-align:center;margin:12px 8px 0",
          )}
        >
          This is not a replacement for therapy or emergency support.
        </p>
      </div>
    </div>
  );
}
