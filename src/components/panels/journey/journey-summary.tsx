"use client";

import Button from "@/components/common/button";
import { PlayIcon } from "@/components/common/icons";
import { useOpenJourneyComposer } from "@/hooks/use-open-journey-composer";
import { useStartActivity } from "@/hooks/use-start-activity";
import { formatDuration } from "@/lib/format";
import { useJourneyStore } from "@/stores/use-journey-store";
import { useMapStore } from "@/stores/use-map-store";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePlayerStore } from "@/stores/use-player-store";
import type { JourneyRoute } from "@/types";

export default function JourneySummary({ route }: { route: JourneyRoute | null }) {
  const reset = useJourneyStore((s) => s.reset);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const detachContext = usePlayerStore((s) => s.detachContext);
  const clearConstellation = useMapStore((s) => s.clearConstellation);
  const startActivity = useStartActivity();
  const openComposer = useOpenJourneyComposer();

  if (!route) return null;

  const handlePlay = () => {
    const ids = route.stops.map((s) => s.id);

    rememberMusicHints(route.stops);
    startActivity("journey", `${route.startMusicId}-${route.endMusicId}`, () => {
      playQueue({ kind: "journey", startMusicId: route.startMusicId, endMusicId: route.endMusicId }, ids);
    });
  };

  const handleClear = () => {
    reset();
    clearConstellation();
    detachContext();
    openComposer();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="lbl">
        총 재생 <b className="num text-sm normal-case tracking-normal text-ink">{formatDuration(route.totalDuration)}</b>
      </span>
      <div className="flex gap-2 max-tablet:shrink-0">
        <Button size="sm" className="max-tablet:whitespace-nowrap" onClick={handleClear}>
          경로 지우기
        </Button>
        <Button size="sm" variant="primary" className="max-tablet:whitespace-nowrap" onClick={handlePlay}>
          <PlayIcon size={14} /> 순차 재생
        </Button>
      </div>
    </div>
  );
}
