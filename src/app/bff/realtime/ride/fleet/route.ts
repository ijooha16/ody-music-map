import { failLive, okLive } from "@/lib/api-response";
import { backendDelete, BackendError } from "@/lib/backend";
import type { ApiErrorCode, DisbandResponse } from "@/types";

const UPSTREAM = "/api/realtime/ride/fleet";

const CODES = new Set<string>(["RIDE_NOT_CAPTAIN", "PRESENCE_ERROR"]);

export async function DELETE() {
  try {
    return okLive((await backendDelete(UPSTREAM)) as DisbandResponse, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive(CODES.has(err.code) ? (err.code as ApiErrorCode) : "INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
