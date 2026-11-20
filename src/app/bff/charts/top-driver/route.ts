import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError } from "@/lib/backend";
import { TOP_DRIVER } from "@/constants";
import type { UserRankingItem } from "@/types";

interface BackendRideRankingItem {
  rank: number;
  email: string;
  nickname: string | null;
  imageUrl: string | null;
  riderCount: number;
}

const toItem = (u: BackendRideRankingItem): UserRankingItem => ({ rank: u.rank, email: u.email, nickname: u.nickname, imageUrl: u.imageUrl, score: u.riderCount });

export async function GET() {
  const upstream = `/api/realtime/ride/ranking?limit=${TOP_DRIVER.limit}`;
  try {
    const res = await backendGet<BackendRideRankingItem[]>(upstream);
    return okLive(res.map(toItem), upstream);
  } catch (e) {
    const err = e as BackendError;

    const code = err.status === 401 ? "UNAUTHENTICATED" : err.status === 404 ? "NOT_IMPLEMENTED" : err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR";
    return failLive(code, err.message, err.status || 502, upstream);
  }
}
