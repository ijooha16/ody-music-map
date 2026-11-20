import type { SurveyEdge, SurveySong } from "@/types/survey";

export interface Trail {
  played: ReadonlySet<number>;

  lastPlayed: number | null;

  unplayable: ReadonlySet<number>;
}

export function nearbyEdge(
  musicId: number,
  trail: Trail,
  list: { sessionId: string; center: SurveySong; neighbors: readonly SurveySong[] },
): SurveyEdge | null {
  const { sessionId, center, neighbors } = list;
  const i = neighbors.findIndex((n) => n.musicId === musicId);
  if (i < 0) return null;

  if (trail.unplayable.has(center.musicId) || trail.unplayable.has(musicId)) return null;
  return {
    target: { sessionId, mode: "nearby", rank: i + 1, anchorMusicId: center.musicId, musicId },
    subject: neighbors[i],
    compare: center,
  };
}

export function journeyEdge(
  musicId: number,
  trail: Trail,
  list: { sessionId: string; stops: readonly SurveySong[] },
): SurveyEdge | null {
  const { sessionId, stops } = list;
  if (stops.length < 2) return null;

  const j = stops.findIndex((s) => s.musicId === musicId);
  if (j < 1) return null;
  const i = trail.lastPlayed == null ? -1 : stops.findIndex((s) => s.musicId === trail.lastPlayed);
  if (i < 0 || j <= i) return null;
  if (!stops.slice(i + 1, j).every((s) => trail.unplayable.has(s.musicId))) return null;
  if (trail.unplayable.has(musicId)) return null;
  return {
    target: {
      sessionId,
      mode: "journey",
      rank: j,
      anchorMusicId: stops[0].musicId,
      targetMusicId: stops[stops.length - 1].musicId,
      prevMusicId: stops[i].musicId,
      musicId,
    },
    subject: stops[j],
    compare: stops[i],
  };
}
