import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError } from "@/lib/backend";
import type { FollowListResponse } from "@/types";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const upstream = `/api/user/follow/list?email=${encodeURIComponent(q.get("email") ?? "")}&type=${q.get("type") ?? "follower"}&page=${q.get("page") ?? 0}`;
  try {
    return okLive(await backendGet<FollowListResponse>(upstream), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.code === "USER_PRIVATE" ? "USER_PRIVATE" : err.status === 404 ? "USER_NOT_FOUND" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
