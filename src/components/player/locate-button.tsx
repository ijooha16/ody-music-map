"use client";

import { useQueryClient } from "@tanstack/react-query";
import { HOME_LOOKUP_FAILED, HOME_NO_COORDS, RIDING_MAP_LOCKED } from "@/constants";

import { LocateIcon } from "@/components/common/icons";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { useBackToMap } from "@/hooks/use-back-to-map";
import { musicDetailQueryOptions } from "@/hooks/queries/use-music-detail-query";
import { musicToMapPoint } from "@/lib/map-point";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useToastStore } from "@/stores/use-toast-store";
import { track } from "@/lib/analytics/client";

export default function LocateButton() {
  const canGoHome = useMapStore((s) => s.canGoHome);

  const backToMap = useBackToMap();
  const queryClient = useQueryClient();

  const handleClick = async () => {
    const showToast = useToastStore.getState().show;
    let r = useMapStore.getState().goHome();
    if (r === "unknown") r = await goHomeWithCoords(showToast);
    track("map_locate_used", { outcome: r });
    backToMap();
    if (r === "follow") showToast(RIDING_MAP_LOCKED);
    else if (r === "none") showToast(HOME_LOOKUP_FAILED);
    else if (r !== "unknown") {
      if (getMapEngine()?.isHomeTraveling()) return;
      const musicId = usePlayerStore.getState().currentMusicId;
      if (musicId != null) usePanelStore.getState().openSong(musicId);
    }
  };

  async function goHomeWithCoords(showToast: (m: string) => void) {
    const musicId = useMapStore.getState().home?.musicId;
    const engine = getMapEngine();
    if (musicId == null || !engine) return "none" as const;
    try {
      const point = musicToMapPoint(await queryClient.fetchQuery(musicDetailQueryOptions(musicId)));
      if (!point) {
        showToast(HOME_NO_COORDS);
        return "unknown" as const;
      }
      engine.adopt([point]);
    } catch {
      showToast(HOME_LOOKUP_FAILED);
      return "unknown" as const;
    }
    return useMapStore.getState().goHome();
  }

  return (
    <button
      data-analytics-manual
      type="button"
      onClick={handleClick}
      disabled={!canGoHome}
      aria-label="내 위치로 가기"
      title="내 위치로 가기"

      className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-white/10 hover:text-teal disabled:cursor-default disabled:text-ink-4 disabled:hover:bg-transparent max-tablet:after:absolute max-tablet:after:-inset-1.5 max-tablet:after:content-['']"
    >
      <LocateIcon />
    </button>
  );
}
