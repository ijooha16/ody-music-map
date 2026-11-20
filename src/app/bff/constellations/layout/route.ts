import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { ConstellationLayout } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { musicIds?: number[] };
  if (!body.musicIds?.length) return fail("VALIDATION_ERROR", "musicIds 가 필요합니다.", 400);

  const upstream = "/api/constellations/layout";
  try {
    const data = await backendPost<ConstellationLayout>(upstream, { musicIds: body.musicIds });
    return okLive(data, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
