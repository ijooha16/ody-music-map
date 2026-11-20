"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FriendsIcon, MapIcon, RankIcon, UserIcon } from "@/components/common/icons";
import { ROUTES } from "@/constants";
import { usePanelEnabled } from "@/hooks/use-features";

interface TabDef {
  href: string;
  label: string;
  icon: ReactNode;

  enabled: boolean;
}

export default function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const panelEnabled = usePanelEnabled();

  const tabs: TabDef[] = [
    { href: ROUTES.home, label: "지도", icon: <MapIcon />, enabled: true },
    { href: ROUTES.friends, label: "주변 사람", icon: <FriendsIcon />, enabled: panelEnabled.friends },
    { href: ROUTES.chart, label: "랭킹", icon: <RankIcon />, enabled: panelEnabled.chart },
    { href: ROUTES.me, label: "마이페이지", icon: <UserIcon />, enabled: panelEnabled.feed },
  ];

  return (
    <div
      data-hud
      data-tabbar

      className="fixed inset-x-0 bottom-0 z-[23] hidden rounded-t-sheet bg-tabbar pb-[env(safe-area-inset-bottom,0px)] max-tablet:block"
    >
      <nav aria-label="네비" className="flex h-tabbar items-center justify-around px-gutter-sm">
        {tabs
          .filter((t) => t.enabled)
          .map((t) => {
            const active = pathname === t.href;
            return (
              <button
                key={t.href}
                type="button"
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                onClick={() => router.push(t.href)}

                className={`flex h-tabbar flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-fast ${
                  active ? "text-teal" : "text-ink-3"
                }`}
              >
                {t.icon}
                <span className="text-2xs leading-none">{t.label}</span>
              </button>
            );
          })}
      </nav>
    </div>
  );
}
