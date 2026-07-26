import { useVC } from "@/lib/store";
import { css } from "./css";

export function Toast() {
  const vc = useVC();
  if (!vc.toast) return null;
  return (
    <div
      className="vc-sheet"
      style={css(
        "position:absolute;left:16px;right:16px;bottom:118px;z-index:80;background:rgba(29,29,31,.94);color:#fff;border-radius:16px;padding:14px 18px;font-size:15px;font-weight:500;text-align:center;backdrop-filter:blur(12px)",
      )}
    >
      {vc.toast}
    </div>
  );
}

export function MorphOverlay() {
  const vc = useVC();
  if (!vc.expanding || !vc.morph) return null;
  return (
    <div
      style={css(
        "position:absolute;inset:0;z-index:70;overflow:hidden;pointer-events:none",
      )}
    >
      <div
        className="vc-morph"
        style={{
          ...css(
            "position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 34%,#173f6b,#081b31 76%)",
          ),
          left: `${vc.morph.left}px`,
          top: `${vc.morph.top}px`,
          width: `${vc.morph.d}px`,
          height: `${vc.morph.d}px`,
          // custom property consumed by the vcMorph keyframes
          ["--sc" as string]: String(vc.morph.sc),
        }}
      />
    </div>
  );
}
