"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ROUTES } from "@/constants";
import { usePanelStore } from "@/stores/use-panel-store";

export function useOpenProfile(): (email: string, opts?: { drill?: boolean }) => void {
  const openFeed = usePanelStore((s) => s.openFeed);
  const drill = usePanelStore((s) => s.drill);
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (email: string, opts: { drill?: boolean } = {}) => {
      if (opts.drill) {
        const fromTab = pathname === ROUTES.chart ? ({ panel: "chart" } as const) : pathname === ROUTES.friends ? ({ panel: "friends" } as const) : null;
        if (fromTab) {
          openFeed(email);
          usePanelStore.setState({ history: [fromTab] }, false, "drill/fromTab");
        } else {
          drill({ panel: "feed", profileEmail: email });
        }
      } else {
        openFeed(email);
      }
      if (pathname !== ROUTES.home) router.push(ROUTES.home);
    },
    [openFeed, drill, pathname, router],
  );
}
