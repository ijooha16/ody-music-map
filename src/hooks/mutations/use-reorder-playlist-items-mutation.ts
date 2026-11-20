import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { PlaylistDetail } from "@/types";

interface ReorderResult {
  playlistId: number;
  musicCnt: number;
}

interface Input {
  playlistId: number;

  musicIds: number[];
}

export function moveItem<T>(list: readonly T[], from: number, to: number): readonly T[] {
  if (from === to) return list;
  if (from < 0 || from >= list.length) return list;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useReorderPlaylistItemsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, musicIds }: Input) =>
      api<ReorderResult>(API_ENDPOINTS.playlist.order(playlistId), { method: "PATCH", body: JSON.stringify({ musicIds }) }),

    onMutate: async ({ playlistId, musicIds }) => {
      const key = QUERY_KEYS.playlist.detail(playlistId);

      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PlaylistDetail>(key);
      if (previous) {
        const byMusicId = new Map(previous.items.map((it) => [it.musicId, it]));
        const items = musicIds.map((id) => byMusicId.get(id)).filter((it): it is NonNullable<typeof it> => it != null);

        if (items.length === previous.items.length) qc.setQueryData<PlaylistDetail>(key, { ...previous, items });
      }
      return { previous };
    },

    onError: (_error, { playlistId }, context) => {
      if (context?.previous) qc.setQueryData(QUERY_KEYS.playlist.detail(playlistId), context.previous);
    },

    onSettled: (_data, _error, { playlistId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.detail(playlistId) });
    },
  });
}
