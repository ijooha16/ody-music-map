import { failLive, okLive } from "@/lib/api-response";
import { backendPatch, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/user/tutorial-completed";

export async function POST(req: Request) {
  try {
    const data = await backendPatch<{ tutorialCompleted: boolean }>(UPSTREAM, {}, { headers: callerAuth(req) });
    return okLive(data, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
