import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, LAYER_USERS, QUERY_KEYS } from "@/constants";
import { api } from "@/lib/api";
import type { LayerUsersSnapshot } from "@/types";

export function useLayerUsersQuery(layer: number, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.realtime.layerUsers(layer),
    queryFn: () => api<LayerUsersSnapshot>(API_ENDPOINTS.realtime.layerUsers(layer)),
    enabled,
    refetchInterval: LAYER_USERS.pollMs,

    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: LAYER_USERS.pollMs,
    retry: 1,
  });
}
