"use client";

import { useVC } from "@/lib/store";
import { BottomNav } from "./BottomNav";
import { PhoneFrame } from "./PhoneFrame";
import { MorphOverlay, Toast } from "./Toast";
import { MiniPlayer } from "./MiniPlayer";
import { Capture } from "./screens/Capture";
import { Detail } from "./screens/Detail";
import { Home } from "./screens/Home";
import { Library } from "./screens/Library";
import { Review } from "./screens/Review";
import { Saved } from "./screens/Saved";
import { Settings } from "./screens/Settings";
import { Therapist } from "./screens/Therapist";

export function AppShell() {
  const vc = useVC();
  const dark = vc.screen === "capture" || vc.screen === "therapist";
  const statusInk = dark ? "#ffffff" : "#1d1d1f";
  const showNav =
    vc.screen === "home" || vc.screen === "library" || vc.screen === "settings";

  return (
    <PhoneFrame statusInk={statusInk}>
      {vc.screen === "home" && <Home />}
      {vc.screen === "capture" && <Capture />}
      {vc.screen === "review" && <Review />}
      {vc.screen === "saved" && <Saved />}
      {vc.screen === "library" && <Library />}
      {vc.screen === "detail" && <Detail />}
      {vc.screen === "therapist" && <Therapist />}
      {vc.screen === "settings" && <Settings />}

      <MorphOverlay />
      <Toast />
      <MiniPlayer raised={showNav} />
      {showNav && <BottomNav />}
    </PhoneFrame>
  );
}
