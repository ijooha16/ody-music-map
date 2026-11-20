"use client";

import { CoronaIcon } from "@/components/common/icons";
import { useJourneyStore } from "@/stores/use-journey-store";
import { useMapStore } from "@/stores/use-map-store";
import { useFollowStore } from "@/stores/use-follow-store";
import { usePanelStore, type SheetSnap } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import RailButton from "./rail-button";

export default function NearbyExploreButton({ bare = false, sheetSnap }: { bare?: boolean; sheetSnap?: SheetSnap }) {
  const viewMode = useMapStore((s) => s.viewMode);
  const selectedMusicId = useMapStore((s) => s.selectedMusicId);
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const enterNearby = useMapStore((s) => s.enterNearby);
  const exitNearby = useMapStore((s) => s.exitNearby);

  const activePanel = usePanelStore((s) => s.activePanel);
  const closePanel = usePanelStore((s) => s.close);
  const setSnap = usePanelStore((s) => s.setSnap);
  const composerOpen = useJourneyStore((s) => s.isComposerOpen);
  const closeComposer = useJourneyStore((s) => s.closeComposer);

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const target = selectedMusicId ?? currentMusicId;
  const active = viewMode === "nearby";
  const disabled = riding || (!active && target == null);

  const handleClick = () => {
    if (active) exitNearby();
    else if (target != null) {
      if (activePanel != null && activePanel !== "song") closePanel();

      else if (activePanel === "song" && sheetSnap != null) setSnap(sheetSnap);
      if (composerOpen) closeComposer();
      enterNearby(target);
      useTutorialStore.getState().complete("nearby");
    }
  };

  return (
    <RailButton
      label="주변 탐색"
      active={active}
      disabled={disabled}

      title={riding ? "따라가는 중에는 지도를 움직일 수 없어요" : disabled ? "곡을 먼저 고르세요" : active ? "주변 탐색 닫기" : "주변 탐색"}
      onClick={handleClick}
      data-tutorial="nearby"
      bare={bare}
    >
      <CoronaIcon size={17} />
    </RailButton>
  );
}
