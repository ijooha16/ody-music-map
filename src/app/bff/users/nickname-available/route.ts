import { failLive, ok, okLive } from "@/lib/api-response";
import { backendGet, BackendError } from "@/lib/backend";
import { nicknameError } from "@/lib/auth-rules";

export async function GET(req: Request) {
  const nickname = (new URL(req.url).searchParams.get("nickname") ?? "").trim();
  if (nicknameError(nickname)) return ok({ available: false });

  const upstream = `/api/users/nickname-available?nickname=${encodeURIComponent(nickname)}`;
  try {
    const data = await backendGet<{ available: boolean }>(upstream);
    return okLive(data, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
