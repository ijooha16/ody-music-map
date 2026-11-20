import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { joinAndWait } from "@/hooks/use-presence-join";
import { ApiError } from "@/lib/api";
import { useMapStore } from "@/stores/use-map-store";
import type { PlayRequest, PlayResponse } from "@/types";

export function useRecordPlayMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlayRequest): Promise<PlayResponse> => {
      await joinAndWait(input.layer);
      try {
        return await post(input);
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== "PRESENCE_ERROR") throw e;

        await joinAndWait(input.layer);
        return await post(input);
      }
    },

    onSuccess: (res, input) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.music.detail(input.musicId) });

      useMapStore.getState().setMyMusicId(res.musicId);
    },
  });
}

const post = (body: PlayRequest) => api<PlayResponse>(API_ENDPOINTS.music.play, { method: "POST", body: JSON.stringify(body) });
