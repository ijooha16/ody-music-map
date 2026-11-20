import { SKETCH_RULES } from "@/constants";
import { fail, okLive } from "@/lib/api-response";
import { backendPost, callerAuth } from "@/lib/backend";
import { artworkFail, toMatch, type BackendDrawResponse } from "@/lib/contest-bff";
import type { SketchPoint } from "@/types";

const UPSTREAM = "/api/artwork/draw";

const isPoint = (p: unknown): p is SketchPoint =>
  typeof p === "object" && p !== null && Number.isFinite((p as SketchPoint).x) && Number.isFinite((p as SketchPoint).y);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { points?: unknown };
  const points = Array.isArray(body.points) ? body.points.filter(isPoint) : [];
  const { minPoints, maxPoints } = SKETCH_RULES;
  if (points.length < minPoints || points.length > maxPoints) return fail("VALIDATION_ERROR", `점은 ${minPoints}~${maxPoints}개여야 합니다.`, 400);

  try {
    const res = await backendPost<BackendDrawResponse>(UPSTREAM, { points: points.map((p) => ({ x: p.x, y: p.y })) }, { headers: callerAuth(req) });
    return okLive(toMatch(res), UPSTREAM);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}
