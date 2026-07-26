import { useVC } from "@/lib/store";
import type { Screen } from "@/lib/types";
import { css } from "./css";

const ON = "#0066cc";
const OFF = "#8e8e93";

export function BottomNav() {
  const vc = useVC();
  const cur = vc.screen;
  const tabs: { screen: Screen; label: string; icon: string; ink: string }[] = [
    { screen: "home", label: "Home", icon: "⌂", ink: cur === "home" ? ON : OFF },
    { screen: "library", label: "History", icon: "☰", ink: cur === "library" ? ON : OFF },
    { screen: "capture", label: "Capture", icon: "●", ink: ON },
    { screen: "settings", label: "Settings", icon: "⚙", ink: cur === "settings" ? ON : OFF },
  ];
  return (
    <>
      <div
        style={css(
          "position:absolute;left:0;right:0;bottom:0;height:92px;background:rgba(255,255,255,.86);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-top:1px solid rgba(0,0,0,.06);display:flex;align-items:flex-start;justify-content:space-around;padding:12px 8px 0;z-index:40",
        )}
      >
        {tabs.map((n) => (
          <button
            key={n.screen}
            className="vc-press"
            onClick={() => vc.navClick(n.screen)}
            style={{
              ...css(
                "flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;border:none;background:none;cursor:pointer",
              ),
              color: n.ink,
            }}
          >
            <span style={css("font-size:22px;line-height:1")}>{n.icon}</span>
            <span style={css("font-size:10px;font-weight:600;letter-spacing:.1px")}>
              {n.label}
            </span>
          </button>
        ))}
      </div>
      <div
        style={css(
          "position:absolute;left:50%;bottom:9px;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:#1d1d1f;z-index:45",
        )}
      />
    </>
  );
}
