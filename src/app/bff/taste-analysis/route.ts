import { failLive, okLive } from "@/lib/api-response";
import { backendGet, backendPost, BackendError } from "@/lib/backend";
import type { ApiErrorCode, TasteAnalysis } from "@/types";

const TASTE_CODES = new Set<string>([
  "TASTE_INSUFFICIENT_SAMPLE",
  "TASTE_DAILY_LIMIT",
  "TASTE_ANALYSIS_IN_PROGRESS",
  "TASTE_REFERENCE_UNAVAILABLE",
]);

function tasteCode(code: string): ApiErrorCode {
  return TASTE_CODES.has(code) ? (code as ApiErrorCode) : "INTERNAL_ERROR";
}

const UPSTREAM = "/api/taste-analysis";

export async function GET() {
  try {
    return okLive(await backendGet<TasteAnalysis>(UPSTREAM), UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive(tasteCode(err.code), err.message, err.status || 502, UPSTREAM);
  }
}

export async function POST() {
  try {
    return okLive(await backendPost<TasteAnalysis>(UPSTREAM, {}), UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive(tasteCode(err.code), err.message, err.status || 502, UPSTREAM);
  }
}
