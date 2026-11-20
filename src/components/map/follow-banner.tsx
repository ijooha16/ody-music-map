"use client";

import { RIDE_RECONNECTING } from "@/constants";
import { useDisbandMutation } from "@/hooks/mutations/use-disband-mutation";
import { useDismountMutation } from "@/hooks/mutations/use-dismount-mutation";
import { useConfirmStore } from "@/stores/use-confirm-store";
import { useFollowStore } from "@/stores/use-follow-store";

export default function FollowBanner() {
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const leaderNickname = useFollowStore((s) => s.leaderNickname);
  const followerCount = useFollowStore((s) => s.followerCount);
  const reconnecting = useFollowStore((s) => s.reconnecting);
  const dismount = useDismountMutation();
  const disband = useDisbandMutation();
  const ask = useConfirmStore((s) => s.ask);

  if (!leaderEmail) {
    if (followerCount <= 0) return null;
    const confirmDisband = () =>
      ask({
        title: "따라오는 사람을 모두 내릴까요?",
        message: `${followerCount}명이 지금 자리에 남고, 듣던 곡은 끊기지 않아요. 내린 뒤에 다시 따라올 수 있어요.`,
        confirmLabel: "모두 내리기",
        cancelLabel: "취소",
        onConfirm: () => disband.mutate(),
      });
    return (
      <div className="glass-liquid animate-tin pointer-events-auto absolute top-[72px] left-1/2 z-30 max-tablet:hidden flex -translate-x-1/2 items-center gap-3 rounded-pill! py-[9px] pr-2.5 pl-3.5">
        <span className="animate-pulse-dot h-2 w-2 shrink-0 rounded-pill bg-teal shadow-[0_0_12px_#4fe3ce]" />
        <div className="text-sm">
          🚀 <b className="num font-semibold">{followerCount}</b>명이 따라오는 중
        </div>
        <button
          type="button"
          onClick={confirmDisband}
          disabled={disband.isPending}
          title="따라오는 사람을 모두 내립니다. 나는 이 자리에 그대로 있어요"
          className="rounded-pill border border-bad/30 bg-bad/[.14] px-[13px] py-[7px] text-xs text-[#ffb3bd] transition-colors hover:bg-bad/25 disabled:opacity-50"
        >
          강제 하차
        </button>
      </div>
    );
  }

  const who = leaderNickname ?? leaderEmail;
  return (
    <div className="glass-liquid animate-tin pointer-events-auto absolute top-[72px] left-1/2 z-30 max-tablet:hidden flex -translate-x-1/2 items-center gap-3 rounded-pill! py-[9px] pr-2.5 pl-3.5">

      {reconnecting ? (
        <span className="animate-pulse-dot h-2 w-2 shrink-0 rounded-pill bg-warn shadow-[0_0_12px_#ffc46b]" />
      ) : (
        <span className="animate-pulse-dot h-2 w-2 shrink-0 rounded-pill bg-violet shadow-[0_0_12px_#a67cff]" />
      )}
      <div>
        <div className="text-sm">
          {reconnecting ? (
            RIDE_RECONNECTING.title(who)
          ) : (
            <>
              🚀 <b className="font-semibold">{who}</b>의 우주선 탑승 중
            </>
          )}
        </div>

        <div className="num text-[12px] tracking-[0.05em] text-ink-3">{reconnecting ? RIDE_RECONNECTING.sub : "지도 조작 잠김 · 하차하면 이 자리에서 이어갑니다"}</div>
      </div>
      <button
        type="button"
        onClick={() => dismount.mutate()}
        disabled={dismount.isPending}
        className="rounded-pill border border-bad/30 bg-bad/[.14] px-[13px] py-[7px] text-xs text-[#ffb3bd] transition-colors hover:bg-bad/25 disabled:opacity-50"
      >
        하차
      </button>
    </div>
  );
}
