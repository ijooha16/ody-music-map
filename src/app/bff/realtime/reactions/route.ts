import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { ApiErrorCode } from "@/types";

const REACTION_CODES = new Set<string>(["REACTION_SELF", "REACTION_NOT_NEARBY", "REACTION_COOLDOWN", "PRESENCE_ERROR"]);

export async function POST(req: Request) {
  const upstream = "/api/realtime/reactions";
  try {
    const body = (await req.json()) as { toEmail: string; reactionKey: string };
    await backendPost<null>(upstream, body, undefined, { allowNullData: true });
    return okLive(null, upstream);
  } catch (e) {
    const err = e as BackendError;
    const code = REACTION_CODES.has(err.code) ? (err.code as ApiErrorCode) : "INTERNAL_ERROR";
    return failLive(code, err.message, err.status || 502, upstream);
  }
}
