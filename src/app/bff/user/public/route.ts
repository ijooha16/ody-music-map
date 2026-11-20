import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPatch, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/user/public";

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { isPublic?: unknown };
  if (typeof body.isPublic !== "boolean") return fail("VALIDATION_ERROR", "isPublic 이 필요합니다.", 400);

  try {
    const data = await backendPatch<{ isPublic: boolean }>(UPSTREAM, { isPublic: body.isPublic }, { headers: callerAuth(req) });
    return okLive(data, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}
