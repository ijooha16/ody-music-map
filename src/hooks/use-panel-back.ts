"use client";

import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";
import { usePlaylistDetailQuery } from "@/hooks/queries/use-playlist-detail-query";
import { useUserProfileQuery } from "@/hooks/queries/use-user-profile-query";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import type { PanelReturn } from "@/lib/panel-history";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";

interface PanelBack {
  target: PanelReturn;

  label: string;
  go: () => void;
}

const FOLLOWS_LABEL = { follower: "팔로워 목록", following: "팔로잉 목록" } as const;

export function usePanelBack(): PanelBack | null {
  const history = usePanelStore((s) => s.history);
  const activePanel = usePanelStore((s) => s.activePanel);
  const musicId = usePanelStore((s) => s.musicId);
  const goBack = usePanelStore((s) => s.goBack);
  const close = usePanelStore((s) => s.close);
  const openJourney = usePanelStore((s) => s.openJourney);
  const openPlaylist = usePanelStore((s) => s.openPlaylist);
  const ids = useMapStore((s) => s.constellationMusicIds);
  const source = useMapStore((s) => s.constellationSource);
  const narrow = useIsNarrow();
  const router = useRouter();
  const pathname = usePathname();

  const last = history[history.length - 1] ?? null;

  const inList = activePanel === "song" && musicId != null && source != null && ids.includes(musicId);
  const target: PanelReturn | null =
    last ??
    (inList && source.kind === "journey"
      ? { panel: "journey" }
      : inList && source.kind === "playlist"
        ? { panel: "playlist", playlistId: source.playlistId }
        : null);

  const { data: backSong } = useMusicDetailQuery(target?.panel === "song" ? target.musicId : null);
  const { data: backPlaylist } = usePlaylistDetailQuery(target?.panel === "playlist" ? target.playlistId : null);
  const { data: backProfile } = useUserProfileQuery(target?.panel === "feed" ? target.profileEmail : null);
  if (!target) return null;

  return {
    target,
    label: labelOf(target, { song: backSong?.title, playlist: backPlaylist?.playlistName, nickname: backProfile?.nickname }),
    go: () => {
      if (!last) {
        if (target.panel === "journey") openJourney();
        else if (target.panel === "playlist") openPlaylist(target.playlistId);
        return;
      }
      const route = narrow ? tabRouteOf(target) : null;
      if (route) {
        close();
        if (pathname !== route) router.push(route);
        return;
      }
      goBack();
    },
  };
}

function labelOf(t: PanelReturn, names: { song?: string; playlist?: string; nickname?: string | null }): string {
  switch (t.panel) {
    case "song":
      return names.song ?? "직전 곡";
    case "playlist":
      return names.playlist ?? "플레이리스트";
    case "journey":
      return "여정";
    case "friends":
      return "주변 사람";
    case "chart":
      return "차트";
    case "feed": {
      const who = t.profileEmail == null ? "마이페이지" : (names.nickname ?? "프로필");
      return t.follows ? `${who} · ${FOLLOWS_LABEL[t.follows]}` : who;
    }
  }
}

function tabRouteOf(t: PanelReturn): string | null {
  if (t.panel === "chart") return ROUTES.chart;
  if (t.panel === "friends") return ROUTES.friends;
  if (t.panel === "feed" && t.profileEmail == null) return ROUTES.me;
  return null;
}
