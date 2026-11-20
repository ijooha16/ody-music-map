import { CONTEST_LEADERBOARD_SIZE, SKETCH_RULES } from "@/constants";
import { fail, okLive } from "@/lib/api-response";
import { backendGet, backendPatch, backendPost, callerAuth } from "@/lib/backend";
import { artworkFail, toEntry, toRound, type BackendArtworkRound, type BackendArtworkSummary } from "@/lib/contest-bff";
import type { ContestLeaderboard, ContestSubmitResult } from "@/types";

const LEADERBOARD = "/api/artwork/leaderboard";
const CREATE_PLAYLIST = "/api/playlist/create";
const RENAME_PLAYLIST = "/api/playlist/update";
const SUBMIT = "/api/artwork/submit";

interface BackendLeaderboard {
  round: BackendArtworkRound;
  items: BackendArtworkSummary[];
  page: number;
  size: number;
  totalCnt: number;
}

export async function GET(req: Request) {
  const upstream = `${LEADERBOARD}?page=0&size=${CONTEST_LEADERBOARD_SIZE}`;
  try {
    const res = await backendGet<BackendLeaderboard>(upstream, { headers: callerAuth(req) });
    const data: ContestLeaderboard = { round: toRound(res.round), items: res.items.map(toEntry), page: res.page, size: res.size, totalCnt: res.totalCnt };
    return okLive(data, upstream);
  } catch (e) {
    return artworkFail(e, upstream);
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { title?: unknown; musicIds?: unknown; playlistId?: unknown; closed?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const musicIds = Array.isArray(body.musicIds) ? body.musicIds.filter((n): n is number => Number.isInteger(n) && n > 0) : [];
  const given = typeof body.playlistId === "number" && Number.isInteger(body.playlistId) && body.playlistId > 0 ? body.playlistId : null;
  const { minPoints, maxPoints, titleMax } = SKETCH_RULES;
  if (!title || title.length > titleMax) return fail("VALIDATION_ERROR", `별자리 이름은 1~${titleMax}자여야 합니다.`, 400);
  if (given == null) {
    if (musicIds.length < minPoints || musicIds.length > maxPoints) return fail("VALIDATION_ERROR", `곡은 ${minPoints}~${maxPoints}개여야 합니다.`, 400);
    if (new Set(musicIds).size !== musicIds.length) return fail("VALIDATION_ERROR", "같은 곡이 두 번 들어 있습니다.", 400);
  }

  const auth = { headers: callerAuth(req) };
  let playlistId: number;
  if (given != null) {
    playlistId = given;
    try {
      await backendPatch<unknown>(RENAME_PLAYLIST, { playlistId, playlistName: title }, auth);
    } catch (e) {
      return artworkFail(e, RENAME_PLAYLIST);
    }
  } else {
    try {
      const created = await backendPost<{ playlistId: number }>(CREATE_PLAYLIST, { playlistName: title, musicIdList: musicIds }, auth);
      playlistId = created.playlistId;
    } catch (e) {
      return artworkFail(e, CREATE_PLAYLIST);
    }
  }
  try {
    const res = await backendPost<{ artworkId: number; status: ContestSubmitResult["status"] }>(SUBMIT, { playlistId, closed: body.closed === true }, auth);
    const data: ContestSubmitResult = { artworkId: res.artworkId, status: res.status, playlistId };
    return okLive(data, SUBMIT, 201);
  } catch (e) {
    const res = artworkFail(e, SUBMIT);

    const json = (await res.json()) as { error?: { message?: string } };
    if (json.error) json.error.message = `${json.error.message ?? "출품에 실패했습니다."} (플레이리스트 「${title}」은 만들어졌어요)`;
    return new Response(JSON.stringify(json), { status: res.status, headers: res.headers });
  }
}
