"use client";

import { useGenerateContestTemplateMutation } from "@/hooks/mutations/use-generate-contest-template-mutation";
import { useContestTemplatesQuery } from "@/hooks/queries/use-contest-templates-query";
import { useContestStore } from "@/stores/use-contest-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { ContestTemplate } from "@/types";

interface TemplatePickerProps {
  loggedIn: boolean;

  theme: string;

  onPicked?: () => void;
}

export default function TemplatePicker({ loggedIn, theme, onPicked }: TemplatePickerProps) {
  const { data: templates } = useContestTemplatesQuery(loggedIn);
  const setMatch = useContestStore((s) => s.setMatch);
  const clear = useContestStore((s) => s.clear);
  const toast = useToastStore((s) => s.show);
  const generate = useGenerateContestTemplateMutation();

  const pick = (t: ContestTemplate) => {
    generate.mutate(t, {
      onSuccess: (m) => {
        clear();
        setMatch(m);
        onPicked?.();
        toast(`AI 가 ${t.label} 모양으로 ${m.tracks.length}곡을 골랐어요 · 플레이리스트 「${m.template?.playlistName ?? t.label}」`);
      },
      onError: (e) => toast(e.message),
    });
  };

  const disabled = !loggedIn || generate.isPending || !templates?.length;
  return (
    <select
      aria-label="AI 추천 모양"
      title={!loggedIn ? "로그인하면 AI 추천 모양을 쓸 수 있어요" : `AI 가 ${theme} 모양대로 곡을 골라 별자리를 만들어요 · 플레이리스트가 함께 생겨요`}
      value=""
      disabled={disabled}
      onChange={(e) => {
        const t = templates?.find((x) => x.name === e.target.value);
        if (t) pick(t);
      }}
      className="h-[30px] rounded-box-xs border border-violet/35 bg-violet/[.14] px-2 text-xs text-ink-2 transition-colors hover:bg-violet/25 focus:outline-none disabled:opacity-45"
    >
      <option value="" disabled>
        {generate.isPending ? "AI 가 고르는 중..." : "✨ AI 추천 모양"}
      </option>
      {templates?.map((t) => (
        <option key={t.name} value={t.name}>
          {t.label} · {t.pointCount}곡
        </option>
      ))}
    </select>
  );
}
