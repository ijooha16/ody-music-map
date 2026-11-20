import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPatch, BackendError, callerAuth } from "@/lib/backend";
import { nicknameError } from "@/lib/auth-rules";

const UPSTREAM = "/api/user/nickname";

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { nickname?: string };
  const nickname = body.nickname?.trim() ?? "";

  if (nicknameError(nickname)) return fail("INVALID_NICKNAME_LENGTH", "닉네임은 2~20자여야 합니다.", 400);

  try {
    const data = await backendPatch<{ nickname: string }>(UPSTREAM, { nickname }, { headers: callerAuth(req) });
    return okLive(data, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.code === "NICKNAME_ALREADY_EXISTS" ? "NICKNAME_ALREADY_EXISTS" : "INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
