import { fail, okLive } from "@/lib/api-response";
import { backendGet, backendPost, callerAuth, type BackendPlaylistDetailResponse } from "@/lib/backend";
import { artworkFail } from "@/lib/contest-bff";
import { templateScore } from "@/lib/contest-view";
import type { ContestMatch, ContestTrack } from "@/types";

const GENERATE = "/api/artwork/generate";

interface BackendGenerate {
  playlistId: number;
  playlistName: string;
  template: string;
  musicCnt: number;
  fitError: number;
  points: { musicId: number; x: number; y: number }[];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { template?: unknown; label?: unknown };
  const template = typeof body.template === "string" ? body.template.trim() : "";
  if (!template) return fail("VALIDATION_ERROR", "template 이 필요합니다.", 400);
  const auth = { headers: callerAuth(req) };

  let gen: BackendGenerate;
  try {
    gen = await backendPost<BackendGenerate>(GENERATE, { template }, auth);
  } catch (e) {
    return artworkFail(e, GENERATE);
  }

  const names = new Map<number, { title: string; artist: string | null }>();
  try {
    const detail = await backendGet<BackendPlaylistDetailResponse>(`/api/playlist/detail?playlistId=${gen.playlistId}`, auth);
    for (const m of detail.musics) names.set(m.id, { title: m.title, artist: m.artist ?? null });
  } catch {
    /* 이름 없이 진행 */
  }

  const tracks: ContestTrack[] = gen.points.map((p) => ({ musicId: p.musicId, x: p.x, y: p.y, title: names.get(p.musicId)?.title ?? null, artist: names.get(p.musicId)?.artist ?? null }));
  const data: ContestMatch = {
    ...templateScore(gen.fitError),
    tracks,
    template: { name: gen.template, label: typeof body.label === "string" ? body.label : gen.template, playlistId: gen.playlistId, playlistName: gen.playlistName, fitError: gen.fitError },
  };
  return okLive(data, GENERATE, 201);
}
