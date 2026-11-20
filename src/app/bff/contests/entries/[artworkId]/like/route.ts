import { fail, okLive } from "@/lib/api-response";
import { backendPost, callerAuth } from "@/lib/backend";
import { artworkFail, parseId } from "@/lib/contest-bff";
import type { ContestLikeResult } from "@/types";

type Ctx = { params: Promise<{ artworkId: string }> };
const UPSTREAM = "/api/artwork/like";

export async function POST(req: Request, { params }: Ctx) {
  const artworkId = parseId((await params).artworkId);
  if (!artworkId) return fail("ARTWORK_NOT_FOUND", "없는 작품입니다.", 404);
  const body = (await req.json().catch(() => ({}))) as { liked?: unknown };
  if (typeof body.liked !== "boolean") return fail("VALIDATION_ERROR", "liked 가 필요합니다.", 400);
  try {
    return okLive(await backendPost<ContestLikeResult>(UPSTREAM, { artworkId, liked: body.liked }, { headers: callerAuth(req) }), UPSTREAM);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}
