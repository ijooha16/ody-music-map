import { okLive } from "@/lib/api-response";
import { backendGet, callerAuth } from "@/lib/backend";
import { artworkFail, toRound, type BackendArtworkRound } from "@/lib/contest-bff";

const UPSTREAM = "/api/artwork/round/current";

export async function GET(req: Request) {
  try {
    const round = await backendGet<BackendArtworkRound | null>(UPSTREAM, { headers: callerAuth(req) }, { allowNullData: true });
    return okLive(round ? toRound(round) : null, UPSTREAM);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}
