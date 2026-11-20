"use client";

import { CatConstellationIcon } from "@/components/common/icons";
import { RIDING_CONTEST_BLOCKED } from "@/constants";
import { useContestCurrentQuery } from "@/hooks/queries/use-contest-current-query";
import { roundPhase } from "@/lib/contest-view";
import { useContestStore } from "@/stores/use-contest-store";
import { useFollowStore } from "@/stores/use-follow-store";

export default function ContestButton() {
  const { data: contest } = useContestCurrentQuery();
  const open = useContestStore((s) => s.open);
  const toggleOpen = useContestStore((s) => s.toggleOpen);

  const riding = useFollowStore((s) => s.leaderEmail != null);
  if (!contest) return null;

  const live = roundPhase(contest) === "OPEN";
  const label = `이벤트 · 별자리 콘테스트 · ${contest.theme}`;

  return (
    <button
      type="button"
      title={riding ? RIDING_CONTEST_BLOCKED : label}
      aria-label={label}
      aria-pressed={open}
      disabled={riding}
      data-tutorial="contest"
      onClick={toggleOpen}
      className={`glass-liquid relative grid h-11 w-11 place-items-center rounded-pill! transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-40 ${
        open ? "border-teal/60! text-ink shadow-glow-azure" : riding ? "text-ink-3" : "text-ink-2 hover:border-line-2 hover:text-ink"
      }`}
    >
      <CatConstellationIcon />
      {live && !open && <span aria-hidden className="absolute top-1 right-1 h-2 w-2 rounded-pill bg-online shadow-[0_0_0_2px_#05080f]" />}
    </button>
  );
}
