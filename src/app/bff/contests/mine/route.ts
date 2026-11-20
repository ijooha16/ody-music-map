import { okLive } from "@/lib/api-response";
import { backendGet, callerAuth } from "@/lib/backend";
import { artworkFail, toEntry, type BackendArtworkSummary } from "@/lib/contest-bff";

const UPSTREAM = "/api/artwork/mine";

export async function GET(req: Request) {
  try {
    const res = await backendGet<BackendArtworkSummary[]>(UPSTREAM, { headers: callerAuth(req) });
    return okLive(res.map(toEntry), UPSTREAM);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}
