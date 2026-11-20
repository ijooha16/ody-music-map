"use client";

import { useEffect, useRef } from "react";
import Box from "@/components/common/box";
import Divider from "@/components/common/divider";
import ErrorMessage from "@/components/common/error-message";
import { useFeatures } from "@/hooks/use-features";
import { PLAYBACK_BLOCKED } from "@/constants";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";
import { usePlayability } from "@/hooks/queries/use-video-id-query";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import SongActions from "./song-actions";
import SongCoverBackdrop from "./song-cover-backdrop";
import SongElsewhereNote from "./song-elsewhere-note";
import SongHeader from "./song-header";
import SongHeaderSkeleton from "./song-header-skeleton";
import SongNearbyList from "./song-nearby-list";
import SongPcList from "./song-pc-list";
import SongRelatedPlaylists from "./song-related-playlists";
import SongReportButton from "./song-report-button";
import SongSectionSkeleton from "./song-section-skeleton";
import { getMapEngine } from "@/components/map/engine/engine-registry";

const COVER_WINDOW = 188;

const SHEET_FADE = 200;

export default function SongDetailPanel() {
  const musicId = usePanelStore((s) => s.musicId);
  const features = useFeatures();
  const { data, isError } = useMusicDetailQuery(musicId);

  const elsewhere = useMapStore((s) => s.selectedMusicId === musicId && s.ghostMusicId === musicId);
  const bodyRef = useRef<HTMLDivElement>(null);

  const { blocked } = usePlayability(musicId);

  const known = musicId != null ? getMapEngine()?.pointOf(musicId) : null;
  const dead = blocked === PLAYBACK_BLOCKED.noVideo;

  const knownPc = known?.pc;
  const pc = (knownPc ? knownPc.map((value, axis) => ({ axis, value })) : null) ?? data?.principalComponents ?? null;

  const hasPlaylists = features.playlist;

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [musicId]);

  return (
    <Box

      title="곡 상세"
      lead={<PanelBackButton />}

      actions={
        <>
          {data && <SongReportButton musicId={data.id} title={data.title} />}
          <PanelCloseButton />
        </>
      }
      flush
      bodyRef={bodyRef}

      bg={musicId != null ? <SongCoverBackdrop musicId={musicId} scrollerRef={bodyRef} reveal={COVER_WINDOW} /> : undefined}
    >

      <div aria-hidden data-cover-window style={{ height: COVER_WINDOW }} />

      <div data-sheet-body className="relative flex flex-col gap-3.5 px-[15px] pt-3.5 pb-[18px] max-tablet:px-gutter-sm">

        <div aria-hidden style={{ height: SHEET_FADE }} className="pointer-events-none absolute inset-x-0 top-0 -z-10 bg-gradient-to-b from-transparent to-void-3 max-tablet:to-void-3/55" />
        <div aria-hidden style={{ top: SHEET_FADE }} className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 bg-void-3 max-tablet:bg-void-3/55" />

        {isError ? (
          <ErrorMessage />
        ) : (
          musicId != null && (
            <div className={`flex flex-col gap-3.5 ${data ? "" : "min-h-[calc(100dvh-212px)]"}`}>
              {data ? <SongHeader music={data} /> : <SongHeaderSkeleton title={known?.title} artist={known?.artist} />}
              {elsewhere && <SongElsewhereNote musicId={musicId} />}
              <SongActions musicId={musicId} />

              {!dead && (
                <div className="flex flex-col gap-5 pt-2">
                  {data ? <SongNearbyList items={data.nearby} centerMusicId={data.id} /> : <SongSectionSkeleton cards />}
                  {hasPlaylists && data && data.relatedPlaylists.length > 0 && (
                    <>
                      <Divider />
                      <SongRelatedPlaylists items={data.relatedPlaylists} />
                    </>
                  )}
                  <Divider />
                  {pc ? <SongPcList items={pc} /> : <SongSectionSkeleton />}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </Box>
  );
}
