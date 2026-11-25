import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { MapEngine } from "@/components/map/engine/map-engine";
import { albumCover } from "@/components/map/render/cover-art";
import { COVER_PX } from "@/components/map/render/sprites";
import { DEMO_SONGS, matchDemoSong, type DemoSong } from "@/constants";
import { musicDetailQueryOptions } from "@/hooks/queries/use-music-detail-query";
import { searchRequestPath } from "@/hooks/queries/use-music-search-query";
import { api } from "@/lib/api";
import { musicToMapPoint } from "@/lib/map-point";
import type { MapPoint, MusicSearchPage, SearchCondition } from "@/types";

const SEARCH_PAGES = 3;

async function resolveId(song: DemoSong): Promise<number | null> {
  if (song.id != null) return song.id;
  const artists = Array.isArray(song.artist) ? song.artist : song.artist ? [song.artist] : [];
  const conds: SearchCondition[] = [
    ...artists.map((artist): SearchCondition => ({ mode: "artist", artist, music: song.title })),
    { mode: "all", query: song.title },
  ];
  for (const cond of conds) {
    for (let page = 0; page < SEARCH_PAGES; page++) {
      const res = await api<MusicSearchPage>(searchRequestPath(cond, page));
      const hit = matchDemoSong(song, res.items);
      if (hit) return hit.id;
      if (!res.hasNext) break;
    }
  }
  return null;
}

async function resolvePoint(qc: QueryClient, song: DemoSong): Promise<MapPoint | null> {
  try {
    const id = await resolveId(song);
    if (id == null) return null;
    return musicToMapPoint(await qc.fetchQuery(musicDetailQueryOptions(id)));
  } catch {
    return null;
  }
}

export function useDemoPins(engine: MapEngine) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!DEMO_SONGS.length) return;
    let alive = true;
    void Promise.all(DEMO_SONGS.map((song) => resolvePoint(qc, song))).then((points) => {
      if (!alive) return;
      const found = points.filter((p): p is MapPoint => p != null);
      if (!found.length) return;
      engine.adopt(found);
      engine.setDemoIds(
        found.map((p) => p.musicId),
        new Map(points.flatMap((p, k) => (p && DEMO_SONGS[k].minLayer ? [[p.musicId, DEMO_SONGS[k].minLayer]] : []))),
      );
      for (const p of found) albumCover(p, COVER_PX);
    });
    return () => {
      alive = false;
    };
  }, [engine, qc]);
}
