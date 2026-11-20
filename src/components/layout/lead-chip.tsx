"use client";

import { useDisbandMutation } from "@/hooks/mutations/use-disband-mutation";
import { useFeatures } from "@/hooks/use-features";
import { useConfirmStore } from "@/stores/use-confirm-store";
import { useFollowStore } from "@/stores/use-follow-store";
import RideChip, { RIDE_CHIP_ACTION } from "./ride-chip";

export default function LeadChip() {
  const features = useFeatures();
  const riding = useFollowStore((s) => s.leaderEmail != null);
  const followerCount = useFollowStore((s) => s.followerCount);
  const disband = useDisbandMutation();
  const ask = useConfirmStore((s) => s.ask);

  if (!features.social || riding || followerCount <= 0) return null;

  const confirmDisband = () =>
    ask({
      title: "따라오는 사람을 모두 내릴까요?",
      message: `${followerCount}명이 지금 자리에 남고, 듣던 곡은 끊기지 않아요. 내린 뒤에 다시 따라올 수 있어요.`,
      confirmLabel: "모두 내리기",
      cancelLabel: "취소",
      onConfirm: () => disband.mutate(),
    });

  return (
    <RideChip
      dot="teal"
      action={
        <button type="button" onClick={confirmDisband} disabled={disband.isPending} className={RIDE_CHIP_ACTION}>
          모두 내리기
        </button>
      }
    >
      🚀 <b className="num font-semibold">{followerCount}</b>명이 따라오는 중
    </RideChip>
  );
}
