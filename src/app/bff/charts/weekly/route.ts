import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError, callerAuth } from "@/lib/backend";
import type { UserRankingItem, WeeklyRanking } from "@/types";

const UPSTREAM = "/api/stats/weekly";

interface BackendRankedUser {
  rank: number;
  email: string;
  nickname: string | null;
  imageUrl: string | null;
  count: number;
}

interface BackendWeeklyStatsResponse {
  weekStart: string;
  weekEnd: string;
  discovery: BackendRankedUser[];
  explore: BackendRankedUser[];
  contribution: BackendRankedUser[];
}

const toItem = (u: BackendRankedUser): UserRankingItem => ({ rank: u.rank, email: u.email, nickname: u.nickname, imageUrl: u.imageUrl, score: u.count });

export async function GET(req: Request) {
  try {
    const res = await backendGet<BackendWeeklyStatsResponse>(UPSTREAM, { headers: callerAuth(req) });
    const data: WeeklyRanking = {
      weekStart: res.weekStart,
      weekEnd: res.weekEnd,
      discovery: (res.discovery ?? []).map(toItem),
      explore: (res.explore ?? []).map(toItem),
      contribution: (res.contribution ?? []).map(toItem),
    };
    return okLive(data, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
