import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, CHANGED, LIKE_FAILED, QUERY_KEYS } from "@/constants";
import { withLikedPlaylist, withPlaylistLike } from "@/lib/optimistic";
import { snapshotQueries } from "@/lib/query-snapshot";
import { useToastStore } from "@/stores/use-toast-store";
import type { PlaylistDetail, PlaylistSummary, User } from "@/types";

interface LikeResponse {
  isLiked: boolean;

  likeCnt: number;
}

export function useLikePlaylistMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: ({ playlistId, liked }: { playlistId: number; liked: boolean }) =>
      api<LikeResponse>(API_ENDPOINTS.playlist.like(playlistId), { method: "POST", body: JSON.stringify({ liked }) }),
    onMutate: async ({ playlistId, liked }) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.playlist.detail(playlistId), QUERY_KEYS.playlist.likedAll]);
      const detail = qc.getQueryData<PlaylistDetail>(QUERY_KEYS.playlist.detail(playlistId));
      qc.setQueryData<PlaylistDetail>(QUERY_KEYS.playlist.detail(playlistId), (prev) => withPlaylistLike(prev, liked));
      const me = qc.getQueryData<User>(QUERY_KEYS.auth.me)?.email ?? null;
      for (const email of me ? [null, me] : [null]) {
        qc.setQueryData<PlaylistSummary[]>(QUERY_KEYS.playlist.liked(email), (prev) => withLikedPlaylist(prev, detail, playlistId, liked));
      }
      return restore;
    },
    onError: (_e, _input, restore) => {
      restore?.();
      showToast(LIKE_FAILED);
    },
    onSuccess: (data, { playlistId }) => {
      showToast(data.isLiked ? CHANGED.playlistLiked : CHANGED.playlistUnliked);
      qc.setQueryData<PlaylistDetail>(QUERY_KEYS.playlist.detail(playlistId), (prev) =>
        prev ? { ...prev, isLiked: data.isLiked, likeCnt: data.likeCnt } : prev,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.likedAll });
    },
  });
}
