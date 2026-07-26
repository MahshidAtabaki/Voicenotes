"use client";

import { AppShell } from "@/components/AppShell";
import { VCProvider } from "@/lib/store";

export default function Page() {
  return (
    <VCProvider>
      <AppShell />
    </VCProvider>
  );
}
