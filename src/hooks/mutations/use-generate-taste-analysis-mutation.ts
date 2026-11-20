import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { API_ENDPOINTS, CHANGED, QUERY_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import type { TasteAnalysis } from "@/types";

export function useGenerateTasteAnalysisMutation() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  return useMutation({
    mutationFn: () => api<TasteAnalysis>(API_ENDPOINTS.taste.analysis, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.taste.analysis, data);

      if (data.generation.status === "GENERATED") showToast(CHANGED.tasteGenerated);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : "UNKNOWN";
      if (code === "TASTE_ANALYSIS_IN_PROGRESS") {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taste.analysis });
        return;
      }
      showToast(error instanceof ApiError ? error.message : "취향 리포트를 만들지 못했습니다.");
    },
  });
}
