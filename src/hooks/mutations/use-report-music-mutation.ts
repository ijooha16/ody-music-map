import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, type ReportReason } from "@/constants";

interface ReportMusicInput {
  musicId: number;
  reason: ReportReason;

  detailReason?: string;
}

export function useReportMusicMutation() {
  return useMutation({
    mutationFn: ({ musicId, reason, detailReason }: ReportMusicInput) =>
      api<{ reportId: number }>(API_ENDPOINTS.music.report(musicId), {
        method: "POST",
        body: JSON.stringify(detailReason ? { reason, detailReason } : { reason }),
      }),
  });
}
