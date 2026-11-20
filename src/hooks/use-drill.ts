"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ROUTES } from "@/constants";
import { usePanelStore, type PanelReturn } from "@/stores/use-panel-store";

const TAB_PANEL: Record<string, PanelReturn> = {
  [ROUTES.me]: { panel: "feed", profileEmail: null },
  [ROUTES.friends]: { panel: "friends" },
  [ROUTES.chart]: { panel: "chart" },
};

export function useDrill(): (target: PanelReturn) => void {
  const drill = usePanelStore((s) => s.drill);
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (target: PanelReturn) => {
      drill(target);
      const fromTab = TAB_PANEL[pathname];
      if (!fromTab) return;

      usePanelStore.setState({ history: [fromTab] }, false, "drill/fromTab");
      router.push(ROUTES.home);
    },
    [drill, pathname, router],
  );
}
