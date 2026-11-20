import { LAYER_SONG_COUNT } from "@/constants";
import { failLive, ok } from "@/lib/api-response";
import { backendGet, BackendError, isBackendEnabled, toResidentPoint, type BackendMapPoint } from "@/lib/backend";
import { contentTag } from "@/lib/content-tag";
import { okLiveGzip } from "@/lib/gzip-json";
import { allSongs } from "@/mocks/songs";
import type { MapPoint } from "@/types";

interface BackendMajorResponse {
  content: BackendMapPoint[];
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;

  if (isBackendEnabled()) {
    const qs = q.toString();
    const upstream = `/api/music/major?${qs || "level=1"}`;
    try {
      const res = await backendGet<BackendMajorResponse>(upstream);
      const points = res.content.map(toResidentPoint);

      return await okLiveGzip(req, points, upstream, contentTag(points));
    } catch (e) {
      const err = e as BackendError;
      return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
    }
  }

  const level = Math.max(1, Math.round(Number(q.get("level") ?? 1)) || 1);

  if (level === 1) return ok(topLevelSongs());

  const num = (key: string, fallback: number) => {
    const raw = q.get(key);
    const v = raw == null ? NaN : Number(raw);
    return Number.isFinite(v) ? v : fallback;
  };

  const boxes = Array.from({ length: level - 1 }, (_, layer) => {
    const k = layer * 2 + 1;
    return {
      d: layer * 2,
      xMin: num(`pc${k}min`, -Infinity),
      xMax: num(`pc${k}max`, Infinity),
      yMin: num(`pc${k + 1}min`, -Infinity),
      yMax: num(`pc${k + 1}max`, Infinity),
    };
  });

  const outside = (s: MapPoint) =>
    boxes.reduce((sum, b) => sum + gap(s.pc[b.d], b.xMin, b.xMax) + gap(s.pc[b.d + 1], b.yMin, b.yMax), 0);

  const resident = allSongs()
    .filter((s) => !s.ghostOnly)
    .map((s) => ({ s, out: outside(s) }))
    .sort((a, b) => a.out - b.out || b.s.weight - a.s.weight)
    .slice(0, LAYER_SONG_COUNT)
    .map((x) => x.s);

  return ok(resident);
}

function gap(v: number, lo: number, hi: number) {
  return v < lo ? lo - v : v > hi ? v - hi : 0;
}

let topLevel: MapPoint[] | null = null;

function topLevelSongs(): MapPoint[] {
  if (topLevel) return topLevel;
  const all = allSongs();
  const ghost = all.filter((s) => s.ghostOnly);
  topLevel = [
    ...all
      .filter((s) => !s.ghostOnly)
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .slice(0, LAYER_SONG_COUNT - ghost.length),
    ...ghost,
  ];
  return topLevel;
}
