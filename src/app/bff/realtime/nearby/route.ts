import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { NearbySnapshot } from "@/types";

export async function POST() {
  const upstream = "/api/realtime/nearby";
  try {
    return okLive(await backendPost<NearbySnapshot>(upstream, {}), upstream);
  } catch (e) {
    const err = e as BackendError;

    const code = err.status === 422 ? "PRESENCE_ERROR" : "INTERNAL_ERROR";
    return failLive(code, err.message, err.status || 502, upstream);
  }
}
