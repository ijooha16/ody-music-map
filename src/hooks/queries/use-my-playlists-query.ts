import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { PlaylistSummary } from "@/types";

export function useMyPlaylistsQuery(email?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.playlist.mine(email ?? null),
    queryFn: () => api<PlaylistSummary[]>(API_ENDPOINTS.playlist.mine(email)),
  });
}
