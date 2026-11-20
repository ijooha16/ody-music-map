"use client";

import Button from "@/components/common/button";
import SectionTitle from "@/components/common/section-title";
import Skeleton from "@/components/common/skeleton";
import Tag from "@/components/common/tag";
import { useRetryContestEntryMutation } from "@/hooks/mutations/use-retry-contest-entry-mutation";
import { useContestArtworkQuery } from "@/hooks/queries/use-contest-artwork-query";
import { useToastStore } from "@/stores/use-toast-store";
import { MY_ARTWORK_THUMB_PX } from "@/constants";
import type { ContestEntry } from "@/types";
import ConstellationThumb from "./constellation-thumb";

const STATUS_LABEL = { PENDING: "채점 중", SCORED: "채점 완료", FAILED: "채점 실패" } as const;

export default function MyArtworkCard({ entry, theme }: { entry: ContestEntry; theme: string }) {
  const toast = useToastStore((s) => s.show);
  const retry = useRetryContestEntryMutation();
  const pending = entry.status === "PENDING";
  const failed = entry.status === "FAILED";

  const { data: shape } = useContestArtworkQuery(entry.status === "SCORED" ? entry.artworkId : null);

  return (
    <div className="flex flex-col gap-2 rounded-box-sm border border-line bg-white/[.03] px-3 py-2.5">
      <SectionTitle aside={<Tag tone={pending ? "violet" : failed ? "warn" : "teal"}>{STATUS_LABEL[entry.status]}</Tag>}>
        내 작품 · {entry.title}
      </SectionTitle>
      {pending && (
        <div className="flex flex-col gap-2 py-1">
          <Skeleton w={72} h={30} rounded="box" />
          <Skeleton w="88%" h={11} />
          <p className="text-xs text-ink-3">AI 가 {theme} 모양을 살펴보는 중이에요. 끝나면 여기에 바로 떠요.</p>
        </div>
      )}
      {entry.status === "SCORED" && (
        <>
          {shape && shape.tracks.length > 1 && (
            <ConstellationThumb tracks={shape.tracks} closed={shape.closed} size={MY_ARTWORK_THUMB_PX} className="mx-auto my-1 border border-line" />
          )}

          <span className="lbl">AI 심사 점수</span>
          <div className="flex items-baseline gap-1.5">
            <span className="num grad-text text-[38px] leading-none font-semibold">{entry.score}</span>
            <span className="lbl">/ 100</span>
            <span className="num ml-auto text-xs text-ink-3">♥ {entry.likeCnt}</span>
          </div>
          <span className="h-1 overflow-hidden rounded-pill bg-white/[.08]">
            <i className="grad-bg block h-full rounded-pill" style={{ width: `${Math.max(3, entry.score ?? 0)}%` }} />
          </span>
          {entry.aiComment && <p className="text-sm leading-relaxed">{entry.aiComment}</p>}
          <p className="text-xs text-ink-3">갤러리와 순위에 올라갔어요. 다시 출품하면 이 점수와 좋아요는 사라져요.</p>
        </>
      )}
      {failed && (
        <>
          <p className="text-sm leading-relaxed text-bad">채점에 실패했어요{entry.failReason ? ` — ${entry.failReason}` : ""}</p>
          <Button
            size="sm"
            variant="secondary"
            disabled={retry.isPending}
            onClick={() => retry.mutate(entry.artworkId, { onSuccess: () => toast("다시 채점을 요청했어요"), onError: (e) => toast(e.message) })}
          >
            {retry.isPending ? "요청 중..." : "다시 채점받기"}
          </Button>
        </>
      )}
    </div>
  );
}
