import { useLayoutEffect } from "react";
import { useMapCoverStore } from "@/stores/use-map-cover-store";

export function useCoverMap(active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    const { cover, uncover } = useMapCoverStore.getState();
    cover();
    return uncover;
  }, [active]);
}
