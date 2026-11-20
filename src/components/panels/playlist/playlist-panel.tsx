"use client";

import { useEffect } from "react";
import Box from "@/components/common/box";
import Divider from "@/components/common/divider";
import ErrorMessage from "@/components/common/error-message";
import { useMyPlaylistsQuery } from "@/hooks/queries/use-my-playlists-query";
import { usePlaylistDetailQuery } from "@/hooks/queries/use-playlist-detail-query";
import { musicToMapPoint } from "@/lib/map-point";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import type { MapPoint } from "@/types";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import PlaylistHeader from "./playlist-header";
import PlaylistSkeleton from "./playlist-skeleton";
import PlaylistTrackList from "./playlist-track-list";

export default function PlaylistPanel() {
  const playlistId = usePanelStore((s) => s.playlistId);
  const { data, isPending, isError } = usePlaylistDetailQuery(playlistId);

  const { data: myPlaylists } = useMyPlaylistsQuery();
  const isMine = data != null && (myPlaylists?.some((p) => p.id === data.id) ?? false);
  const showConstellation = useMapStore((s) => s.showConstellation);

  const items = data?.items;
  useEffect(() => {
    if (!items || items.length < 2 || playlistId == null) return;

    showConstellation(
      items.map((it) => it.musicId),
      items.map((it) => musicToMapPoint(it.music)).filter((p): p is MapPoint => p != null),
      { kind: "playlist", playlistId },
    );
  }, [items, playlistId, showConstellation]);

  return (
    <Box lead={<PanelBackButton />} title="플레이리스트" actions={<PanelCloseButton />}>
      {isPending && <PlaylistSkeleton />}
      {isError && <ErrorMessage />}
      {data && (
        <>
          <PlaylistHeader playlist={data} />
          <Divider />
          <PlaylistTrackList playlist={data} editable={isMine} />
        </>
      )}
    </Box>
  );
}
