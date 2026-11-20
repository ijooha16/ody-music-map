"use client";

import Note from "@/components/common/note";
import TextInput from "@/components/common/text-input";
import { SKETCH_RULES } from "@/constants";
import { useContestStore } from "@/stores/use-contest-store";
import type { Contest, ContestEntry, ContestMatch } from "@/types";

interface SubmitFormProps {
  contest: Contest;
  match: ContestMatch;

  my: ContestEntry | null;

  onSubmit: () => void;
}

export default function SubmitForm({ contest, match, my, onSubmit }: SubmitFormProps) {
  const title = useContestStore((s) => s.title);
  const setTitle = useContestStore((s) => s.setTitle);
  const { titleMax } = SKETCH_RULES;

  return (
    <div className="flex flex-col gap-2">
      <label className="lbl" htmlFor="contest-title">
        별자리 이름
      </label>
      <TextInput
        id="contest-title"
        autoFocus
        value={title}
        maxLength={titleMax}
        placeholder={match.template ? match.template.playlistName : `예: 창가의 회색 ${contest.theme}`}
        autoComplete="off"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      />
      <p className="num -mt-1 text-right text-[12.5px] text-ink-4">
        {title.length} / {titleMax}
      </p>
      {my && <Note>이미 「{my.title}」을 냈어요. 다시 내면 이전 작품이 지워지고 점수·좋아요가 초기화돼요.</Note>}
    </div>
  );
}
