import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS, RIDE_REJECTED } from "@/constants";
import { api, ApiError } from "@/lib/api";
import { endRide, leaveRideLocally } from "@/lib/realtime/ride";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { DismountResponse } from "@/types";

export function useDismountMutation() {
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: () => dismountRide(),
    onError: (e) => {
      const message = toastFor(e);
      if (message) showToast(message);
    },
  });
}

export async function dismountRide(): Promise<void> {
  const wasRiding = useFollowStore.getState().leaderEmail != null;
  leaveRideLocally();
  try {
    endRide(await api<DismountResponse>(API_ENDPOINTS.realtime.ride, { method: "DELETE" }));
  } catch (e) {
    const map = useMapStore.getState();
    if (wasRiding) endRide({ musicId: null, layer: map.layer });
    throw e;
  }
}

function toastFor(e: unknown): string {
  const code = e instanceof ApiError ? e.code : "UNKNOWN";

  if (code === "RIDE_NOT_RIDING") return "";
  return RIDE_REJECTED[code as keyof typeof RIDE_REJECTED] ?? RIDE_REJECTED.UNKNOWN;
}
