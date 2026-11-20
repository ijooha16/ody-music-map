"use client";

import { ArriveIcon, DepartIcon } from "@/components/common/icons";
import Note from "@/components/common/note";
import { RIDING_JOURNEY_BLOCKED, PLAYBACK_BLOCKED } from "@/constants";
import { usePlayability } from "@/hooks/queries/use-video-id-query";
import { useOpenJourneyComposer } from "@/hooks/use-open-journey-composer";
import { useFollowStore } from "@/stores/use-follow-store";
import { useJourneyStore } from "@/stores/use-journey-store";

const HALF =
  "flex flex-1 items-center justify-center gap-[7px] px-2 py-2.5 text-[16px] transition-colors duration-fast not-disabled:hover:bg-white/[.07] disabled:cursor-not-allowed disabled:opacity-40";

export default function SongActions({ musicId }: { musicId: number }) {
  const setStart = useJourneyStore((s) => s.setStart);
  const setEnd = useJourneyStore((s) => s.setEnd);

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const openComposer = useOpenJourneyComposer();

  const { blocked } = usePlayability(musicId);

  const dead = blocked === PLAYBACK_BLOCKED.noVideo;

  return (
    <div className="flex flex-col gap-2">

      <div className="flex overflow-hidden rounded-box-sm border border-line bg-white/[.04]">
        <button
          type="button"
          aria-label={riding ? RIDING_JOURNEY_BLOCKED : dead ? "재생할 수 없는 곡은 여정에 쓸 수 없어요" : "이 곡을 여정 출발점으로 지정"}
          title={riding ? RIDING_JOURNEY_BLOCKED : undefined}
          disabled={dead || riding}
          className={HALF}
          onClick={() => {
            setStart(musicId);
            openComposer("end");
          }}
        >
          <DepartIcon className="text-teal" /> 출발점으로
        </button>
        <span aria-hidden className="w-px shrink-0 bg-line" />
        <button
          type="button"
          aria-label={riding ? RIDING_JOURNEY_BLOCKED : dead ? "재생할 수 없는 곡은 여정에 쓸 수 없어요" : "이 곡을 여정 도착점으로 지정"}
          title={riding ? RIDING_JOURNEY_BLOCKED : undefined}
          disabled={dead || riding}
          className={HALF}
          onClick={() => {
            setEnd(musicId);
            openComposer("start");
          }}
        >
          <ArriveIcon className="text-violet" /> 도착점으로
        </button>
      </div>

      {blocked && <Note>{blocked.detail}</Note>}
    </div>
  );
}
