"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ROUTES } from "@/constants";
import { useCoverMap } from "@/hooks/use-cover-map";
import { usePanelEnabled } from "@/hooks/use-features";
import type { PanelType } from "@/constants";

export default function PanelScreen({ panel, children }: { panel: PanelType; children: ReactNode }) {
  const router = useRouter();
  const panelEnabled = usePanelEnabled();
  const enabled = panelEnabled[panel];

  useEffect(() => {
    if (!enabled) router.replace(ROUTES.home);
  }, [enabled, router]);

  useCoverMap(enabled);

  if (!enabled) return null;

  return (
    <main
      data-panel-screen
      className="glass-bar fixed inset-x-0 top-0 z-[20] flex h-dvh flex-col overflow-hidden rounded-none border-0! pt-[env(safe-area-inset-top,0px)] shadow-none! [&>section>header]:h-[68px] [&>section>header]:pt-6 [&>section>header]:pb-4 [--glass-blur:18px] [--glass-tint:rgb(6_9_17/0.6)] [&>section]:min-h-0 [&>section]:flex-1 [&>section]:rounded-none! [&>section]:border-0 [&>section]:bg-transparent [&>section]:shadow-none [&>section]:backdrop-filter-none">
      {children}
    </main>
  );
}
