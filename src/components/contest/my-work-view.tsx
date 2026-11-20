import type { ReactNode } from "react";
import Note from "@/components/common/note";
import { roundPhase } from "@/lib/contest-view";
import type { Contest, ContestEntry } from "@/types";
import MyArtworkCard from "./my-artwork-card";

interface MyWorkViewProps {
  entry: ContestEntry;
  contest: Contest;

  note?: ReactNode;
}

export default function MyWorkView({ entry, contest, note }: MyWorkViewProps) {
  const open = roundPhase(contest) === "OPEN";
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <MyArtworkCard entry={entry} theme={contest.theme} />
      {note && <p className="px-1 text-sm leading-relaxed text-ink-2">{note}</p>}
      {!open && <Note>지금은 접수 기간이 아니라 새로 낼 수 없어요.</Note>}
    </div>
  );
}
