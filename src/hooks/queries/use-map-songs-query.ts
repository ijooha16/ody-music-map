import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import {
  forgetLayerSetsExcept,
  layerSetUsedAt,
  layerSetsToEvict,
  touchLayerSet,
} from "@/lib/map-songs-cache";
import type { LayerBox, MapPoint } from "@/types";

export function useMapSongsQuery(boxes: readonly LayerBox[]) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.map.songs(boxes);
  const rangeKey = queryKey[2];

  const query = useQuery({
    queryKey,
    queryFn: () => api<MapPoint[]>(API_ENDPOINTS.map.songs(boxes)),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    touchLayerSet(rangeKey);
    const cached = queryClient.getQueryCache().findAll({ queryKey: ["map", "songs"] });
    const present = new Set(cached.map((q) => String(q.queryKey[2])));
    forgetLayerSetsExcept(present);
    const drop = layerSetsToEvict(
      cached.map((q) => {
        const key = String(q.queryKey[2]);
        return { key, active: q.getObserversCount() > 0, usedAt: layerSetUsedAt(key) };
      }),
    );
    for (const key of drop) queryClient.removeQueries({ queryKey: ["map", "songs", key], exact: true });
  }, [queryClient, rangeKey]);

  return query;
}
