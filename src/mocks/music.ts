import { NEARBY_COUNT } from "@/constants";
import type { JourneyRoute, Music, MusicDetail, MusicSearchResult, NearbyResponse } from "@/types";
import { seeded } from "./seed";
import { allSongs, demoAlbumNumber, embDist, GENRE_NAMES, MOODS, nearestSongs, songById } from "./songs";

export { GENRE_NAMES, MOODS };

export function mockMusic(id: number): Music {
  const s = songById(id);
  const rand = seeded(id);
  return {
    id,
    mbid: `mock-${id.toString(16).padStart(8, "0")}`,
    title: s?.title ?? `Track ${id}`,
    artist: s?.artist ?? `Artist ${(id % 40) + 1}`,
    releaseYear: 1968 + Math.floor(rand() * 57),
    bpm: Math.round((62 + rand() * 110) * 10) / 10,
    duration: 96 + Math.floor(rand() * 268),
    album: `Album ${demoAlbumNumber(id)}`,
    albumCoverUrl: s?.albumCoverUrl ?? null,
    youtubeUrl: s && !s.playable ? null : `https://www.youtube.com/watch?v=mock${id}`,

    location: s ? (s.pc as Music["location"]) : null,
    playCnt: s?.weight ?? Math.floor(rand() * 50_000),
    youtubeCnt: s && !s.playable ? 0 : 1 + Math.floor(rand() * 3),
  };
}

export function mockMusicDetail(id: number): MusicDetail {
  const base = mockMusic(id);
  const s = songById(id);
  const pc = s?.pc ?? [];
  return {
    ...base,
    liked: false,
    country: "KR",
    language: "ko",
    composer: `Composer ${(id % 15) + 1}`,
    lyricist: `Lyricist ${(id % 12) + 1}`,
    moods: [MOODS[id % MOODS.length], MOODS[(id + 2) % MOODS.length]],
    principalComponents: pc.map((v, i) => ({ axis: i, value: v })),
    nearby: (s ? nearestSongs(s, NEARBY_COUNT) : []).map((p) => ({ id: p.musicId, title: p.title, artist: p.artist, albumCoverUrl: p.albumCoverUrl })),
    relatedPlaylists: [
      { id: 1, playlistName: "새벽 드라이브", email: "luna@ody.app" },
      { id: 2, playlistName: "집중용", email: "nova@ody.app" },
    ],
  };
}

export function mockNearby(musicId: number): NearbyResponse {
  const center = songById(musicId) ?? allSongs()[0];
  return { center, neighbors: nearestSongs(center, NEARBY_COUNT) };
}

export function mockSearch({ q, artist, music }: { q: string; artist: string; music: string }): MusicSearchResult[] {
  const starts = (value: string | null, prefix: string) => (value ?? "").toLowerCase().startsWith(prefix.toLowerCase());
  const all = q.trim();
  const byArtist = artist.trim();
  const byMusic = music.trim();
  if (!all && !byArtist && !byMusic) return [];
  return allSongs()
    .filter((p) =>
      all
        ? starts(p.title, all) || starts(p.artist, all)
        : byArtist
          ? starts(p.artist, byArtist) && (!byMusic || starts(p.title, byMusic))
          : starts(p.title, byMusic),
    )
    .slice(0, 48)
    .map((p) => ({ id: p.musicId, title: p.title, artist: p.artist }));
}

export function mockJourney(startId: number, endId: number): JourneyRoute {
  const songs = allSongs();
  const a = songById(startId) ?? songs[0];
  const b = songById(endId) ?? songs[1];
  const N = 20;
  const used = new Set([a.musicId, b.musicId]);
  const path = [a];
  let cur = a;
  for (let i = 1; i < N - 1; i++) {
    const remain = N - 1 - i;
    let best: (typeof songs)[number] | null = null;
    let bestScore = Infinity;
    for (const s of songs) {
      if (used.has(s.musicId) || !s.playable) continue;
      const step = embDist(cur, s);
      if (step < 1e-6) continue;

      const score = step + embDist(s, b) / remain;
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (!best) break;
    used.add(best.musicId);
    path.push(best);
    cur = best;
  }
  path.push(b);
  const stops = path.map((s, i) => {
    const m = mockMusic(s.musicId);
    return { id: s.musicId, title: s.title, artist: s.artist, duration: m.duration, order: i, pc: [...s.pc] };
  });
  return { startMusicId: a.musicId, endMusicId: b.musicId, stops, totalDuration: stops.reduce((sum, s) => sum + (s.duration ?? 0), 0) };
}
