"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { HUD_OCCLUSION } from "@/constants";
import type { Occlusion } from "@/components/map/engine/map-engine";
import { useFeatures, usePanelEnabled } from "@/hooks/use-features";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { useBrandBottom, usePlayerBarHeight, useTabBarHeight } from "@/hooks/use-hud-bar-height";
import { useJourneyStore } from "@/stores/use-journey-store";
import { usePanelStore } from "@/stores/use-panel-store";
import BottomBar from "@/components/player/bottom-bar";
import ConfirmDialog from "@/components/common/confirm-dialog";
import Toast from "@/components/common/toast";
import Brand from "./brand";
import TopScrim from "./top-scrim";
import MapActions from "./map-actions";
import Rail from "./rail";
import JourneyComposer from "./journey-composer";
import SearchBar from "./search-bar";
import FollowBanner from "@/components/map/follow-banner";
import GhostBanner from "@/components/map/ghost-banner";
import MapAxisLabels from "@/components/map/map-axis-labels";
import MapView from "@/components/map/map-view";
import { useRealtime } from "@/hooks/use-realtime";
import { useHomeTravelPanel } from "@/hooks/use-home-travel-panel";
import { usePanelFollowsTrack } from "@/hooks/use-panel-follows-track";
import MinimapPanel from "@/components/minimap/minimap-panel";
import RightPanel from "@/components/panels/right-panel";
import { HANDLE_W } from "@/components/common/collapse-handle";
import { RIGHT_PANEL_W, SHEET_RADIUS_PX, SHEET_SNAP_PX } from "@/constants/design-tokens";
import PlayHint from "@/components/discovery/play-hint";
import ContestModal from "@/components/contest/contest-modal";
import SurveyGate from "@/components/survey/survey-gate";

const PANEL_EDGE = 18;

const PEEK_OCCLUSION = HANDLE_W;
const PANEL_OCCLUSION = RIGHT_PANEL_W + PANEL_EDGE + 16;

interface MainScreenProps {
  overlay?: ReactNode;
}

export default function MainScreen({ overlay }: MainScreenProps) {
  const activePanel = usePanelStore((s) => s.activePanel);
  const snap = usePanelStore((s) => s.snap);
  const sheetStop = usePanelStore((s) => s.sheetStop);
  const sheetPeek = usePanelStore((s) => s.sheetPeek);
  const panelCollapsed = snap === 1;
  const composerOpen = useJourneyStore((s) => s.isComposerOpen);

  const features = useFeatures();

  useRealtime();
  usePanelFollowsTrack();
  useHomeTravelPanel();
  const panelEnabled = usePanelEnabled();
  const panelOpen = activePanel != null && panelEnabled[activePanel];

  const narrow = useIsNarrow();
  const occludedRight = narrow ? 0 : panelOpen && !panelCollapsed ? PANEL_OCCLUSION : PEEK_OCCLUSION;

  const playerH = usePlayerBarHeight();
  const tabBarH = useTabBarHeight();

  const navBottom = `calc(var(--spacing-tabbar) + env(safe-area-inset-bottom, 0px) + ${playerH}px - var(--radius-sheet))`;

  useEffect(() => {
    document.documentElement.style.setProperty("--nav-bottom", navBottom);
  }, [navBottom]);

  const measured = snap === 1 ? sheetPeek : sheetStop;
  const sheetH = narrow && panelOpen ? (measured ?? SHEET_SNAP_PX[snap]) : 0;
  const occludedBottom = narrow ? tabBarH + playerH - SHEET_RADIUS_PX + sheetH : HUD_OCCLUSION.bottom;

  const brandBottom = useBrandBottom(HUD_OCCLUSION.top);
  const occludedTop = narrow ? brandBottom : HUD_OCCLUSION.top;
  const occlusion = useMemo<Occlusion>(
    () => ({ top: occludedTop, right: occludedRight, bottom: occludedBottom, left: 0 }),
    [occludedTop, occludedRight, occludedBottom],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-void text-ink">
      <MapView occlusion={occlusion} />

      {!narrow && <MapAxisLabels occlusion={occlusion} />}

      <TopScrim />
      <Brand />

      {composerOpen ? <JourneyComposer /> : <SearchBar />}
      {features.social && <FollowBanner />}
      <GhostBanner />
      <Rail />

      <MapActions />
      {panelOpen && <RightPanel />}
      <MinimapPanel />
      <BottomBar />
      {overlay}

      {features.playHint && <PlayHint />}

      {features.contest && <ContestModal />}
      <Toast />
      <ConfirmDialog />

      <SurveyGate />
    </div>
  );
}
