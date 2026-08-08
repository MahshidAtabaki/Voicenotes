import type { ReactNode } from "react";
import { css } from "./css";
import { PHONE_OVERLAY_Z_INDEX } from "@/lib/delete-confirmation";

/** iPhone device chrome + status bar. Preserved from the design frame. */
export function PhoneFrame({
  statusInk,
  children,
}: {
  statusInk: string;
  children: ReactNode;
}) {
  return (
    <div
      style={css(
        "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px",
      )}
    >
      <div
        style={css(
          "position:relative;width:414px;max-width:100%;height:872px;background:#0a0a0c;border-radius:56px;padding:12px;box-shadow:0 50px 90px -30px rgba(0,0,0,.45),0 0 0 2px rgba(255,255,255,.04) inset",
        )}
      >
        {/* notch */}
        <div
          style={css(
            "position:absolute;top:26px;left:50%;transform:translateX(-50%);width:120px;height:32px;background:#0a0a0c;border-radius:20px;z-index:60",
          )}
        />
        <div
          data-screen-host="1"
          style={css(
            "position:relative;width:100%;height:100%;background:#ffffff;border-radius:44px;overflow:hidden",
          )}
        >
          {/* status bar */}
          <div
            style={{
              ...css(
                "position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 30px 8px;z-index:50;pointer-events:none;font-weight:600;font-size:15px;letter-spacing:-.2px",
              ),
              color: statusInk,
            }}
          >
            <span>9:41</span>
            <span style={css("display:flex;align-items:center;gap:7px")}>
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor" />
                <rect x="4.5" y="4.5" width="3" height="7.5" rx="1" fill="currentColor" />
                <rect x="9" y="2" width="3" height="10" rx="1" fill="currentColor" />
                <rect x="13.5" y="0" width="3" height="12" rx="1" fill="currentColor" opacity=".35" />
              </svg>
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                <rect x="1" y="1" width="20" height="10" rx="3" stroke="currentColor" strokeOpacity=".45" fill="none" />
                <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" />
                <rect x="22" y="4" width="1.6" height="4" rx="1" fill="currentColor" opacity=".5" />
              </svg>
            </span>
          </div>
          {children}
          <div
            data-phone-overlay-host="1"
            style={{
              ...css(
                "position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none",
              ),
              zIndex: PHONE_OVERLAY_Z_INDEX,
            }}
          />
        </div>
      </div>
    </div>
  );
}
