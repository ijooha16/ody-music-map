import Tag from "@/components/common/tag";
import { roundPhase } from "@/lib/contest-view";
import type { Contest } from "@/types";

const PHASE_LABEL = { UPCOMING: "시작 전", OPEN: "접수·좋아요 중", CLOSED: "마감" } as const;

const md = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function ContestHeader({ contest }: { contest: Contest }) {
  const phase = roundPhase(contest);
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Tag tone={phase === "OPEN" ? "teal" : "default"}>{PHASE_LABEL[phase]}</Tag>
          <span className="lbl">좋아요 {contest.voteLimit}표</span>
        </div>
        <h3 className="font-display text-[22px] leading-tight font-semibold">
          이번 테마는 <span className="grad-text font-extrabold">{contest.theme}</span>
        </h3>
      </div>
      <p className="text-xs text-ink-3">
        {md(contest.startsAt)} ~ {md(contest.endsAt)}
      </p>
    </div>
  );
}
