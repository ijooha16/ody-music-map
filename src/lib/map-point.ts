import { NO_GENRE_ID } from "@/constants";
import type { MapPoint, Music } from "@/types";

export function musicToMapPoint(m: Music): MapPoint | null {
  if (!m.location) return null;
  return {
    musicId: m.id,
    pc: [...m.location],
    genreId: NO_GENRE_ID,
    weight: m.playCnt,
    title: m.title,
    artist: m.artist,

    albumMbid: m.albumMbid ?? null,
    albumCoverUrl: m.albumCoverUrl ?? null,
    youtubeUrl: m.youtubeUrl,
    playable: m.youtubeUrl != null,
  };
}
