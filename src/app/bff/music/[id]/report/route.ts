import { REPORT_DETAIL_MAX, REPORT_REASONS } from "@/constants";
import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";

interface BackendReportResponse {
  reportId: number;
}

const REASONS = new Set<string>(REPORT_REASONS.map((r) => r.value));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const musicId = Number(id);
  const upstream = "/api/music/report";
  if (!Number.isInteger(musicId) || musicId < 1) return failLive("VALIDATION_ERROR", "곡 ID 가 올바르지 않습니다.", 400, upstream);

  let body: { reason?: unknown; detailReason?: unknown };
  try {
    body = await req.json();
  } catch {
    return failLive("INVALID_INPUT", "요청 본문이 JSON 이 아닙니다.", 400, upstream);
  }

  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!REASONS.has(reason)) return failLive("VALIDATION_ERROR", "신고 사유가 올바르지 않습니다.", 400, upstream);

  const detailReason = typeof body.detailReason === "string" ? body.detailReason.trim() : "";
  if (detailReason.length > REPORT_DETAIL_MAX) return failLive("VALIDATION_ERROR", "상세 사유가 너무 깁니다.", 400, upstream);

  try {
    const res = await backendPost<BackendReportResponse>(upstream, { musicId, reason, ...(detailReason ? { detailReason } : {}) });
    return okLive(res, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}
