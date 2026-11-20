"use client";

import { CONTEST_RANK_TAG } from "@/constants";
import Tag from "@/components/common/tag";
import { useContestEntriesQuery } from "@/hooks/queries/use-contest-entries-query";
import { useFeatures } from "@/hooks/use-features";
import { contestRankOf } from "@/lib/contest-top";
import { useContestStore } from "@/stores/use-contest-store";
import { usePlayerStore } from "@/stores/use-player-store";

export default function ContestRankTag() {
  const features = useFeatures();
  const context = usePlayerStore((s) => s.context);
  const playlistId = context.kind === "playlist" ? context.playlistId : null;
  const { data } = useContestEntriesQuery(features.contest && playlistId != null);
  const openAt = useContestStore((s) => s.openAt);
  const rank = features.contest ? contestRankOf(data?.items, playlistId) : null;
  if (rank == null) return null;
  return (
    <button type="button" onClick={() => openAt("gallery")} className="relative self-start max-tablet:order-first max-tablet:basis-full">
      <Tag tone="warn" title="이벤트 갤러리 보기">
        {CONTEST_RANK_TAG(rank)}
      </Tag>
    </button>
  );
}
