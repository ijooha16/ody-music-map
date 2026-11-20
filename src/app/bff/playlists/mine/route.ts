import { fail, failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError, callerAuth, emailFromToken, toPlaylistSummary, type BackendPlaylistSummary } from "@/lib/backend";

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") || emailFromToken(req);
  if (!email) return fail("UNAUTHENTICATED", "인증이 필요합니다.", 401);

  const upstream = `/api/playlist/search?email=${encodeURIComponent(email)}`;
  try {
    const res = await backendGet<{ content: BackendPlaylistSummary[] }>(upstream, { headers: callerAuth(req) });
    return okLive((res.content ?? []).map(toPlaylistSummary), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
