import { fail, failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError, callerAuth, emailFromToken, isBackendEnabled, toUser, type BackendUserDetail } from "@/lib/backend";
import { DEMO_EMAIL } from "@/mocks/backend";

export async function GET(req: Request) {
  const email = emailFromToken(req) ?? (isBackendEnabled() ? null : DEMO_EMAIL);
  if (!email) return fail("UNAUTHENTICATED", "인증이 필요합니다.", 401);

  const upstream = `/api/user/detail?email=${encodeURIComponent(email)}`;
  try {
    const data = await backendGet<BackendUserDetail>(upstream, { headers: callerAuth(req) });
    return okLive(toUser(data), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
