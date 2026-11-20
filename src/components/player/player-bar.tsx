"use client";

import { useState } from "react";
import { RIDING_LOCKED } from "@/constants";
import { NextIcon, PauseIcon, PlayIcon, PlaylistAddIcon, PrevIcon } from "@/components/common/icons";
import AddToPlaylistDialog from "@/components/panels/playlist/add-to-playlist-dialog";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";
import { usePlayability } from "@/hooks/queries/use-video-id-query";
import { useBackToMap } from "@/hooks/use-back-to-map";
import { useFeatures } from "@/hooks/use-features";
import { useMusicLabel } from "@/hooks/use-music-label";
import { useFollowStore } from "@/stores/use-follow-store";
import { useJourneyStore } from "@/stores/use-journey-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { useToastStore } from "@/stores/use-toast-store";
import { usePlayerStore } from "@/stores/use-player-store";
import LocateButton from "./locate-button";
import PlayerBackdrop from "./player-backdrop";
import ContestRankTag from "./contest-rank-tag";
import PlayerProgress from "./player-progress";
import TransportButton from "@/components/common/transport-button";
import { track } from "@/lib/analytics/client";

export default function PlayerBar() {
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const context = usePlayerStore((s) => s.context);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const toggle = usePlayerStore((s) => s.toggle);

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const showToast = useToastStore((s) => s.show);
  const openSong = usePanelStore((s) => s.openSong);
  const openPlaylist = usePanelStore((s) => s.openPlaylist);
  const openJourney = usePanelStore((s) => s.openJourney);
  const features = useFeatures();
  const backToMap = useBackToMap();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useMusicDetailQuery(currentMusicId);

  const { title, artist } = useMusicLabel(currentMusicId);

  const openContext = () => {
    if (currentMusicId == null) return;

    backToMap();
    const map = useMapStore.getState();
    const reopenConstellation = () => {
      if (map.constellationMusicIds.length >= 2 && map.viewMode !== "constellation") map.toggleConstellationView();
    };
    if (context.kind === "playlist") {
      openPlaylist(context.playlistId);
      reopenConstellation();
    } else if (context.kind === "journey") {
      const j = useJourneyStore.getState();
      j.setStart(context.startMusicId);
      j.setEnd(context.endMusicId);
      j.requestRoute();
      openJourney();
      reopenConstellation();
    } else if (context.kind === "nearby") {
      map.enterNearby(context.centerMusicId);
      openSong(context.centerMusicId);
    } else openSong(currentMusicId);
  };

  const { canPlay: playable, blocked, retry } = usePlayability(currentMusicId);
  const canPlay = playable && currentMusicId != null;

  const handleToggle = () => {
    if (currentMusicId == null) return;

    if (riding) {
      showToast(RIDING_LOCKED);
      return;
    }
    if (blocked) {
      track("action_blocked", { action: "play", reason: blocked.ref, music_id: currentMusicId });
      showToast(blocked.notice);

      if (blocked.retryable) retry();
      return;
    }
    toggle();
  };
  const contextLabel = context.kind === "playlist" ? "플레이리스트" : context.kind === "journey" ? "여정" : context.kind === "nearby" ? "주변 음악" : null;
  const idle = currentMusicId == null;
  const subtitle = idle
    ? "지도에서 별을 눌러 골라보세요"
    : [artist ?? "-", contextLabel && `${contextLabel} 재생 중`, queue.length > 0 && `${queueIndex + 1}/${queue.length}`].filter(Boolean).join(" · ");

  return (
    <div data-analytics-manual className="glass-liquid relative flex min-w-0 flex-1 flex-col gap-2.5 overflow-visible px-4 pt-3.5 pb-3 max-tablet:flex-row max-tablet:flex-wrap max-tablet:items-center max-tablet:gap-x-2 max-tablet:gap-y-1 max-tablet:rounded-none! max-tablet:border-0 max-tablet:px-gutter-sm max-tablet:pt-4 max-tablet:pb-[calc(14px+var(--radius-sheet))] max-tablet:shadow-[0_-8px_20px_-10px_rgb(0_0_0/0.45)] max-tablet:[--glass-blur:18px] max-tablet:[--glass-tint:rgb(6_9_17/0.45)]">
      <PlayerBackdrop musicId={currentMusicId} />

      <button type="button" onClick={openContext} disabled={idle} className="relative min-w-0 text-left max-tablet:min-w-0 max-tablet:flex-1">
        <p className="truncate font-display text-[17px] leading-tight font-semibold text-ink max-tablet:text-[15px]">
          {idle ? "재생할 곡을 고르세요" : title}
          {!idle && blocked && <span className="ml-2 text-[12.5px] font-normal text-warn">{blocked.badge}</span>}
        </p>

        <p className={`mt-0.5 truncate text-[14.5px] text-ink-2 [text-shadow:0_1px_3px_rgba(2,4,10,.7)] max-tablet:text-[12.5px] ${idle ? "max-tablet:hidden" : ""}`}>{subtitle}</p>
      </button>

      <ContestRankTag />

      <div className="relative max-tablet:order-last max-tablet:w-full">
        <PlayerProgress musicId={currentMusicId} durationSec={data?.duration} canPlay={canPlay} />
      </div>

      <div className="relative flex items-center justify-between max-tablet:shrink-0 max-tablet:gap-1">

        <LocateButton />
        <div className="flex items-center gap-3">
          <TransportButton label="이전" onClick={() => { track("play_prev_requested", { music_id: currentMusicId, at_boundary: queueIndex === 0 }); prev(); }} disabled={riding || queue.length === 0}>
            <PrevIcon />
          </TransportButton>
          <TransportButton label={isPlaying ? "정지" : "재생"} primary size="lg" onClick={handleToggle} dimmed={!canPlay || riding}>
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </TransportButton>
          <TransportButton label="다음" onClick={() => { track("play_next_requested", { music_id: currentMusicId, at_boundary: queueIndex + 1 >= queue.length }); next(); }} disabled={riding || queue.length === 0}>
            <NextIcon />
          </TransportButton>
        </div>

        {features.playlist ? (
          <TransportButton label="플레이리스트에 추가" disabled={idle} onClick={() => setMenuOpen((v) => !v)}>
            <PlaylistAddIcon />
          </TransportButton>
        ) : (
          <span className="h-8 w-8" />
        )}
      </div>

      {features.playlist && menuOpen && currentMusicId != null && <AddToPlaylistDialog musicId={currentMusicId} onDone={() => setMenuOpen(false)} />}
    </div>
  );
}
