"use client";

import { RIDE_RECONNECTING } from "@/constants";
import { useDismountMutation } from "@/hooks/mutations/use-dismount-mutation";
import { useFeatures } from "@/hooks/use-features";
import { useFollowStore } from "@/stores/use-follow-store";
import RideChip, { RIDE_CHIP_ACTION } from "./ride-chip";

export default function RideBar() {
  const features = useFeatures();
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const leaderNickname = useFollowStore((s) => s.leaderNickname);
  const reconnecting = useFollowStore((s) => s.reconnecting);
  const dismount = useDismountMutation();

  if (!features.social || leaderEmail == null) return null;

  return (
    <RideChip
      dot={reconnecting ? "warn" : "violet"}
      action={
        <button
          type="button"
          title="하차 — 이 자리에서 이어갑니다"
          onClick={() => dismount.mutate()}
          disabled={dismount.isPending}
          className={RIDE_CHIP_ACTION}
        >
          하차
        </button>
      }
    >
      {reconnecting ? (
        RIDE_RECONNECTING.title(leaderNickname ?? leaderEmail)
      ) : (
        <>
          🚀 <b className="font-semibold">{leaderNickname ?? leaderEmail}</b>의 우주선 탑승 중
        </>
      )}
    </RideChip>
  );
}
