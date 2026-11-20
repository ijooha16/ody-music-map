import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS, RIDE_DISBAND_REJECTED, RIDE_DISBANDED } from "@/constants";
import { api, ApiError } from "@/lib/api";
import { useFollowStore } from "@/stores/use-follow-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { DisbandResponse } from "@/types";

export function useDisbandMutation() {
  const showToast = useToastStore((s) => s.show);
  const setFollowerCount = useFollowStore((s) => s.setFollowerCount);
  return useMutation({
    mutationFn: () => api<DisbandResponse>(API_ENDPOINTS.realtime.rideFleet, { method: "DELETE" }),
    onMutate: () => {
      const ride = useFollowStore.getState();
      const before = { count: ride.followerCount, riders: ride.riders };
      setFollowerCount(0);
      ride.setRiders([]);
      return before;
    },
    onSuccess: (res) => {
      setFollowerCount(0);
      useFollowStore.getState().setRiders([]);
      showToast(RIDE_DISBANDED(res.riderCount));
    },
    onError: (e, _v, before) => {
      const code = e instanceof ApiError ? e.code : "UNKNOWN";
      if (code !== "RIDE_NOT_CAPTAIN" && before) {
        setFollowerCount(before.count);
        useFollowStore.getState().setRiders(before.riders);
      }
      showToast(RIDE_DISBAND_REJECTED[code as keyof typeof RIDE_DISBAND_REJECTED] ?? RIDE_DISBAND_REJECTED.UNKNOWN);
    },
  });
}
