"use client";

import { RIDE_RESUME, RIDE_RESUMING, STORAGE_KEYS } from "@/constants";
import { ApiError } from "@/lib/api";
import { readStorage } from "@/lib/storage";
import { isRiding, useFollowStore } from "@/stores/use-follow-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { RideTarget } from "@/hooks/mutations/use-ride-mutation";

let timer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;

export function cancelResume(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  attempt = 0;
  useFollowStore.getState().setReconnecting(false);
}

export function resumeRide(target: RideTarget, mount: (t: RideTarget) => Promise<unknown>, giveUp: (code: string) => void): void {
  if (timer) clearTimeout(timer);
  timer = null;
  mount(target).then(
    () => {
      attempt = 0;

      useFollowStore.getState().setReconnecting(false);
    },
    (e: unknown) => {
      const code = e instanceof ApiError ? e.code : "UNKNOWN";

      if (code === "RIDE_ALREADY_RIDING") {
        attempt = 0;
        useFollowStore.getState().setReconnecting(false);
        return;
      }
      if ((RIDE_RESUME.finalCodes as readonly string[]).includes(code) || attempt >= RIDE_RESUME.backoffMs.length) {
        attempt = 0;
        giveUp(code);
        return;
      }
      if (attempt === 0) useToastStore.getState().show(RIDE_RESUMING);

      useFollowStore.getState().setReconnecting(true);
      const wait = RIDE_RESUME.backoffMs[attempt++];
      timer = setTimeout(() => {
        timer = null;

        if (!isRiding() && !readStorage(STORAGE_KEYS.rideLeader)) {
          attempt = 0;
          return;
        }
        resumeRide(target, mount, giveUp);
      }, wait);
    },
  );
}
