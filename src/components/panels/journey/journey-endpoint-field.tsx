"use client";

import { useMusicLabel } from "@/hooks/use-music-label";

interface JourneyEndpointFieldProps {
  label: string;
  tone: "teal" | "violet";
  musicId: number | null;

  onOpenComposer: () => void;
}

export default function JourneyEndpointField({ label, tone, musicId, onOpenComposer }: JourneyEndpointFieldProps) {
  const { title, artist } = useMusicLabel(musicId);
  const dot = tone === "teal" ? "bg-teal shadow-[0_0_7px_#4fe3ce]" : "bg-violet shadow-[0_0_7px_#a67cff]";

  return (
    <button
      type="button"
      onClick={onOpenComposer}
      title="검색창에서 바꾸기"
      className="group flex w-full items-center gap-2.5 py-1 text-left"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-pill ${dot}`} />

      <span className="lbl w-6 shrink-0 max-tablet:w-auto max-tablet:whitespace-nowrap">{label}</span>

      <span className="min-w-0 flex-1 truncate text-[15px] transition-colors group-hover:text-teal max-tablet:flex-initial">
        {musicId == null ? <span className="text-ink-4">지정 안 됨</span> : title}
      </span>
      <span className="shrink-0 truncate text-[13px] text-ink-3 max-tablet:min-w-0 max-tablet:flex-1 max-tablet:text-right">{artist ?? ""}</span>
    </button>
  );
}
