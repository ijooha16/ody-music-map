"use client";

import { useMapStore } from "@/stores/use-map-store";

export default function SongElsewhereNote({ musicId }: { musicId: number }) {
  const surfaceToMusic = useMapStore((s) => s.surfaceToMusic);

  return (
    <div className="flex items-center justify-between gap-2 rounded-[13px] border border-dashed border-violet/35 bg-violet/[.06] px-2.5 py-1.5">
      <span className="text-[13px] leading-[1.4] text-ink-2">이 겹에 없는 곡이에요</span>
      <button
        type="button"
        onClick={() => surfaceToMusic(musicId)}
        className="shrink-0 rounded-pill bg-white/[.09] px-2.5 py-[4px] text-[13px] text-ink transition-colors hover:bg-white/[.16]"
      >
        그 자리로 가기
      </button>
    </div>
  );
}
