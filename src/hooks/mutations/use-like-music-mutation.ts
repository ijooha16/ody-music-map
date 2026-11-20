import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, CHANGED, LIKE_FAILED, QUERY_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import type { MusicDetail } from "@/types";

interface Input {
  musicId: number;

  liked: boolean;
}

export function useLikeMusicMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const setLiked = (musicId: number, liked: boolean) =>
    qc.setQueryData<MusicDetail>(QUERY_KEYS.music.detail(musicId), (prev) => (prev ? { ...prev, liked } : prev));

  return useMutation({
    mutationFn: (body: Input) => api<{ liked: boolean }>(API_ENDPOINTS.music.like, { method: "POST", body: JSON.stringify(body) }),
    onMutate: ({ musicId, liked }) => setLiked(musicId, liked),
    onSuccess: (data, { musicId }) => {
      setLiked(musicId, data.liked);
      showToast(data.liked ? CHANGED.musicLiked : CHANGED.musicUnliked);
    },
    onError: (_e, { musicId, liked }) => {
      setLiked(musicId, !liked);
      showToast(LIKE_FAILED);
    },
  });
}
