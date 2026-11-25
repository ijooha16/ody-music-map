"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ListPlayIcon } from "@/components/common/icons";
import TransportButton from "@/components/common/transport-button";
import InfoHint from "@/components/common/info-hint";
import Note from "@/components/common/note";
import SectionTitle from "@/components/common/section-title";
import { NEARBY_COUNT } from "@/constants";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";
import { useStartActivity } from "@/hooks/use-start-activity";
import { useMapStore } from "@/stores/use-map-store";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import type { MusicDetail } from "@/types";
import SongNearbyCard from "./song-nearby-card";

const CARD_W = 112;
const CARD_GAP = 8;

function RailArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "이전 카드" : "다음 카드"}
      onClick={onClick}
      className={`glass absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-pill! text-ink-2 opacity-80 transition-opacity duration-fast hover:text-ink hover:opacity-100 ${
        side === "left" ? "left-1.5" : "right-1.5"
      }`}
    >
      <ChevronLeftIcon className={side === "right" ? "rotate-180" : ""} />
    </button>
  );
}

interface SongNearbyListProps {
  items: MusicDetail["nearby"];
  centerMusicId: number;
}

export default function SongNearbyList({ items, centerMusicId }: SongNearbyListProps) {
  const viewMode = useMapStore((s) => s.viewMode);
  const nearbyCenterMusicId = useMapStore((s) => s.nearbyCenterMusicId);
  const enterNearby = useMapStore((s) => s.enterNearby);
  const selectMusic = useMapStore((s) => s.selectMusic);
  const openNeighborSong = usePanelStore((s) => s.openNeighborSong);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const startActivity = useStartActivity();
  const inNearby = viewMode === "nearby";

  const isOnHere = inNearby && nearbyCenterMusicId === centerMusicId;

  const away = inNearby && !isOnHere;

  const { data: centerSong } = useMusicDetailQuery(away ? nearbyCenterMusicId : null);
  const railRef = useRef<HTMLDivElement>(null);

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const readEdges = (el: HTMLDivElement) => {
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    readEdges(el);
  }, [centerMusicId]);

  const nudge = (dir: 1 | -1) => railRef.current?.scrollBy({ left: dir * (CARD_W + CARD_GAP) * 2, behavior: "smooth" });

  const handlePlayAll = () => {
    const ids = [centerMusicId, ...items.map((m) => m.id)];
    if (ids.length < 2) return;

    rememberMusicHints(items);
    startActivity("nearby", String(centerMusicId), () => {
      if (!inNearby || nearbyCenterMusicId !== centerMusicId) enterNearby(centerMusicId);
      playQueue({ kind: "nearby", centerMusicId }, ids);
    });
  };

  const handlePick = (id: number) => {
    if (!isOnHere) enterNearby(centerMusicId, true);
    useTutorialStore.getState().complete("nearby");
    openNeighborSong(id);
    selectMusic(id);
  };

  return (
    <div className="flex flex-col gap-2">

      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <SectionTitle
            tone="sentence"
            aside={
              away ? (
                <span className="block max-w-[110px] truncate text-teal" title={`지도는 ${centerSong?.title ?? "다른 곡"} 주변이에요`}>
                  {centerSong?.title ?? "다른 곡"} 주변
                </span>
              ) : inNearby ? (
                <span className="text-teal">주변 탐색 중</span>
              ) : undefined
            }
          >
            이 곡과 가장 비슷해요!{" "}
            <InfoHint label="유사도 설명">
              <b className="font-medium text-ink">유사도</b>는 소리를 16차원으로 압축한 좌표에서 잰 거리예요. 가까울수록 소리가 닮았다는 뜻이에요.
            </InfoHint>
          </SectionTitle>

          <Note>{away ? "카드를 누르면 이 곡 주변으로 옮겨가요." : "오른쪽 버튼을 누르면 주변곡을 이어서 들어요."}</Note>
        </div>

        <TransportButton label={`${NEARBY_COUNT}곡 순차 재생`} primary disabled={items.length === 0} onClick={handlePlayAll}>
          <ListPlayIcon size={16} />
        </TransportButton>
      </div>

      <div className="relative -mx-[15px]">
        <div ref={railRef} onScroll={(e) => readEdges(e.currentTarget)} className="rail flex snap-x snap-mandatory scroll-pl-[15px] gap-2 overflow-x-auto px-[15px] pb-0.5">
          {items.map((m, i) => (
            <SongNearbyCard
              key={m.id}
              musicId={m.id}
              title={m.title}
              artist={m.artist}
              albumMbid={m.albumMbid}
              albumCoverUrl={m.albumCoverUrl}
              rank={i + 1}
              playing={currentMusicId === m.id}
              onClick={() => handlePick(m.id)}
            />
          ))}
        </div>
        {!atStart && <RailArrow side="left" onClick={() => nudge(-1)} />}
        {!atEnd && <RailArrow side="right" onClick={() => nudge(1)} />}
      </div>
    </div>
  );
}
