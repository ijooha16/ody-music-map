import { fail, okLive } from "@/lib/api-response";
import { backendGet, callerAuth } from "@/lib/backend";
import { artworkFail, parseId, toShape, type BackendArtworkDetail } from "@/lib/contest-bff";

type Ctx = { params: Promise<{ artworkId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const artworkId = parseId((await params).artworkId);
  if (!artworkId) return fail("ARTWORK_NOT_FOUND", "없는 작품입니다.", 404);
  const upstream = `/api/artwork/detail?artworkId=${artworkId}`;
  try {
    const res = await backendGet<BackendArtworkDetail>(upstream, { headers: callerAuth(req) });
    return okLive(toShape(res), upstream);
  } catch (e) {
    return artworkFail(e, upstream);
  }
}
