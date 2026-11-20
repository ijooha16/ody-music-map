import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, CHANGE_FAILED, CHANGED, QUERY_KEYS } from "@/constants";
import { withoutPlaylist } from "@/lib/optimistic";
import { snapshotQueries } from "@/lib/query-snapshot";
import { useToastStore } from "@/stores/use-toast-store";
import type { PlaylistSummary } from "@/types";

export function useDeletePlaylistMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (playlistId: number) => api<{ ok: boolean }>(API_ENDPOINTS.playlist.detail(playlistId), { method: "DELETE" }),
    onMutate: async (playlistId) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.playlist.mineAll, QUERY_KEYS.playlist.likedAll]);
      const name =
        qc
          .getQueriesData<PlaylistSummary[]>({ queryKey: QUERY_KEYS.playlist.mineAll })
          .flatMap(([, list]) => list ?? [])
          .find((p) => p.id === playlistId)?.playlistName ?? null;

      qc.setQueriesData<PlaylistSummary[]>({ queryKey: QUERY_KEYS.playlist.mineAll }, (prev) => withoutPlaylist(prev, playlistId));
      qc.setQueriesData<PlaylistSummary[]>({ queryKey: QUERY_KEYS.playlist.likedAll }, (prev) => withoutPlaylist(prev, playlistId));
      return { restore, name };
    },
    onError: (_e, _id, ctx) => {
      ctx?.restore();
      showToast(CHANGE_FAILED);
    },
    onSuccess: (_data, _playlistId, ctx) => {
      showToast(CHANGED.playlistDeleted(ctx?.name ?? null));
      qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.all });
    },
  });
}
