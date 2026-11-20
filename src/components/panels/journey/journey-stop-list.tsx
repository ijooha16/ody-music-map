"use client";

import IconButton from "@/components/common/icon-button";
import { PlayIcon } from "@/components/common/icons";
import SectionTitle from "@/components/common/section-title";
import TrackRow from "@/components/common/track-row";
import { JOURNEY_MAX_SONGS } from "@/constants";
import { useStartActivity } from "@/hooks/use-start-activity";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import type { JourneyRoute } from "@/types";

export default function JourneyStopList({ route }: { route: JourneyRoute | null }) {
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const openSong = usePanelStore((s) => s.openSongFromList);
  const startActivity = useStartActivity();
  if (!route) return null;

  const ids = route.stops.map((s) => s.id);

  const playFrom = (index: number) => {
    rememberMusicHints(route.stops);
    startActivity("journey", `${route.startMusicId}-${route.endMusicId}`, () =>
      playQueue({ kind: "journey", startMusicId: route.startMusicId, endMusicId: route.endMusicId }, ids, index),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionTitle aside={`정거장 ${route.stops.length} · 최대 ${JOURNEY_MAX_SONGS}`}>경로</SectionTitle>
      <div className="-mx-1.5 flex flex-col gap-0.5">
        {route.stops.map((s) => (
          <TrackRow
            key={s.id}
            index={s.order + 1}
            title={s.title}
            artist={s.artist}

            meta={null}
            duration={s.duration}
            active={s.id === currentMusicId}
            onClick={() => openSong(s.id)}
            actions={
              <span className="flex opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                <IconButton
                  label="이 곡부터 재생"
                  size={26}
                  onClick={(e) => {
                    e.stopPropagation();
                    playFrom(s.order);
                  }}
                >
                  <PlayIcon size={15} />
                </IconButton>
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
}
