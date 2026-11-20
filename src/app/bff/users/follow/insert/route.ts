import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { FollowResponse } from "@/types";
import { followCode } from "./follow-code";

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
