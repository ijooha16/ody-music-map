"use client";

import { useCallback, useRef } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { useDismissOnOutside } from "@/hooks/use-dismiss-on-outside";
import { usePanelEnabled } from "@/hooks/use-features";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { usePanelSwipe } from "@/hooks/use-panel-swipe";
import { useContestStore } from "@/stores/use-contest-store";
import { usePanelStore } from "@/stores/use-panel-store";
import ChartPanel from "./chart/chart-panel";
import FeedPanel from "./feed/feed-panel";
import FriendsPanel from "./friends/friends-panel";
import JourneyPanel from "./journey/journey-panel";
import PanelCollapseHandle from "./panel-collapse-handle";
import PlaylistPanel from "./playlist/playlist-panel";
import SongDetailPanel from "./song-detail/song-detail-panel";

export default function RightPanel() {
  const activePanel = usePanelStore((s) => s.activePanel);
  const snap = usePanelStore((s) => s.snap);

  const contestOpen = useContestStore((s) => s.open);
  const collapsed = snap === 1 || contestOpen;
  const raiseSnap = usePanelStore((s) => s.raiseSnap);
  const lowerSnap = usePanelStore((s) => s.lowerSnap);
  const panelEnabled = usePanelEnabled();

  const swipe = usePanelSwipe();
  const panelRef = useRef<HTMLElement>(null);

  const dismissOnMap = useCallback(
    (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest("[data-map]")) return false;

      if (snap === 3) return "swallow";
      const engine = getMapEngine();

      return engine?.hitTest(e.clientX, e.clientY) == null && engine?.hitFriend?.(e.clientX, e.clientY) == null;
    },
    [snap],
  );
  useDismissOnOutside(panelRef, lowerSnap, useIsNarrow() && activePanel != null, dismissOnMap);
  if (!activePanel) return null;

  if (!panelEnabled[activePanel]) return null;

  return (
    <aside
      ref={panelRef}
      data-hud
      data-tutorial={`panel-${activePanel}`}
      {...swipe}
      className={`animate-tin absolute top-[72px] right-[18px] z-20 flex max-h-[calc(100dvh-264px)] w-right-panel flex-col transition-[translate] duration-500 ease-out ${
        collapsed ? "translate-x-[calc(100%_+_18px)] max-tablet:translate-x-0" : ""
      } max-tablet:inset-x-0 max-tablet:top-[calc(var(--spacing-hud-t)+40px)] max-tablet:bottom-0 max-tablet:w-auto max-tablet:max-h-none max-tablet:[&>section]:flex-1`}

      data-sheet

      data-snap={snap}
    >
      <PanelCollapseHandle />

      <button
        type="button"

        onClick={raiseSnap}
        aria-expanded={snap === 3}
        aria-label={snap === 3 ? "시트 내리기" : "시트 올리기"}

        className="absolute inset-x-0 top-0 z-[2] hidden items-center justify-center pt-1.5 pb-1 max-tablet:flex"
      >
        <span aria-hidden className="h-1 w-10 rounded-pill bg-white/30" />
      </button>
      {activePanel === "song" && <SongDetailPanel />}
      {activePanel === "playlist" && <PlaylistPanel />}
      {activePanel === "feed" && <FeedPanel />}
      {activePanel === "journey" && <JourneyPanel />}
      {activePanel === "friends" && <FriendsPanel />}
      {activePanel === "chart" && <ChartPanel />}
    </aside>
  );
}
