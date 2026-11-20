import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError, callerAuth, toUserProfile, type BackendUserDetail } from "@/lib/backend";

export async function GET(req: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const upstream = `/api/user/detail?email=${encodeURIComponent(decodeURIComponent(email))}`;
  try {
    const data = await backendGet<BackendUserDetail>(upstream, { headers: callerAuth(req) });
    return okLive(toUserProfile(data), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
