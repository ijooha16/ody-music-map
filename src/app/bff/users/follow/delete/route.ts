import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { FollowResponse } from "@/types";

export async function POST(req: Request) {
  const upstream = "/api/user/follow/delete";
  try {
    const body = (await req.json()) as { followeeEmail: string };
    return okLive(await backendPost<FollowResponse>(upstream, body), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.status === 404 ? "USER_NOT_FOUND" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
