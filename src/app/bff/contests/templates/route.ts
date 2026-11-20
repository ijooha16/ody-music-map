import { okLive } from "@/lib/api-response";
import { backendGet, callerAuth } from "@/lib/backend";
import { artworkFail } from "@/lib/contest-bff";
import type { ContestTemplate } from "@/types";

const UPSTREAM = "/api/artwork/templates";

export async function GET(req: Request) {
  try {
    return okLive(await backendGet<ContestTemplate[]>(UPSTREAM, { headers: callerAuth(req) }), UPSTREAM);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}
