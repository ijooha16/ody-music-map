import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { FollowResponse } from "@/types";

export async function POST(req: Request) {
  const upstream = "/api/user/follow/insert";
  try {
    const body = (await req.json()) as { followeeEmail: string };
    return okLive(await backendPost<FollowResponse>(upstream, body), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(followCode(err.status), err.message, err.status || 502, upstream);
  }
}

export const followCode = (status: number) =>
  status === 400 ? "SELF_FOLLOW_NOT_ALLOWED" : status === 404 ? "USER_NOT_FOUND" : status === 409 ? "ALREADY_FOLLOWING" : "INTERNAL_ERROR";
