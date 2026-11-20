import { DEMO } from "@/constants/demo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, CHANGE_FAILED, CHANGED, QUERY_KEYS } from "@/constants";
import { withItemCount, withPlaylistItem } from "@/lib/optimistic";
import { snapshotQueries } from "@/lib/query-snapshot";
import { useToastStore } from "@/stores/use-toast-store";
import type { MusicDetail, PlaylistDetail, PlaylistSummary } from "@/types";

interface InsertResult {
  playlistId: number;
  insertedCnt: number;
  skippedCnt: number;
  musicCnt: number;
}

interface Input {
  playlistId: number;
  musicId: number;
}

export function useAddPlaylistItemMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: ({ playlistId, musicId }: Input) =>
      api<InsertResult>(API_ENDPOINTS.playlist.items(playlistId), { method: "POST", body: JSON.stringify({ musicId }) }),
    onMutate: async ({ playlistId, musicId }) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.playlist.detail(playlistId), QUERY_KEYS.playlist.mineAll]);
      const detail = qc.getQueryData<PlaylistDetail>(QUERY_KEYS.playlist.detail(playlistId));
      const known = detail?.items.some((it) => it.musicId === musicId) ?? false;
      if (!known) {
        const music = qc.getQueryData<MusicDetail>(QUERY_KEYS.music.detail(musicId));
        qc.setQueryData<PlaylistDetail>(QUERY_KEYS.playlist.detail(playlistId), (prev) => withPlaylistItem(prev, music));
        qc.setQueriesData<PlaylistSummary[]>({ queryKey: QUERY_KEYS.playlist.mineAll }, (prev) => withItemCount(prev, playlistId, 1));
      }
      return restore;
    },
    onError: (_e, _input, restore) => {
      restore?.();
      showToast(CHANGE_FAILED);
    },
    onSuccess: (data, { playlistId }, restore) => {
      const name = qc.getQueryData<PlaylistSummary[]>(QUERY_KEYS.playlist.mine(null))?.find((p) => p.id === playlistId)?.playlistName ?? null;
      const duplicate = data.insertedCnt === 0 && data.skippedCnt > 0;
      if (duplicate) restore?.();

      showToast(duplicate && !DEMO ? CHANGED.playlistItemDuplicate : CHANGED.playlistItemAdded(name));
      qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.detail(playlistId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.mineAll });
    },
  });
}
