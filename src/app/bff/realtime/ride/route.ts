import { failLive, okLive } from "@/lib/api-response";
import { backendDelete, backendPost, BackendError } from "@/lib/backend";
import type { ApiErrorCode, DismountResponse, RideResponse } from "@/types";

const RIDE_CODES = new Set<string>([
  "RIDE_CAPTAIN_INACTIVE",
  "RIDE_SELF",
  "RIDE_ALREADY_RIDING",
  "RIDE_CHAIN_FORBIDDEN",
  "RIDE_FULL",
  "RIDE_NOT_RIDING",
  "RIDE_NOT_CAPTAIN",
  "RIDE_STALE",
  "PRESENCE_ERROR",
]);

function rideCode(code: string): ApiErrorCode {
  return RIDE_CODES.has(code) ? (code as ApiErrorCode) : "INTERNAL_ERROR";
}

export async function POST(req: Request) {
  const upstream = "/api/realtime/ride";
  try {
    const body = (await req.json()) as { captainEmail: string };
    return okLive(await backendPost<RideResponse>(upstream, body), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(rideCode(err.code), err.message, err.status || 502, upstream);
  }
}

export async function DELETE() {
  const upstream = "/api/realtime/ride";
  try {
    return okLive((await backendDelete(upstream)) as DismountResponse, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(rideCode(err.code), err.message, err.status || 502, upstream);
  }
}
