"use client";

import Tag from "@/components/common/tag";
import { useContestLike } from "@/hooks/use-contest-like";
import { useSaveContestToPlaylist } from "@/hooks/use-save-contest-to-playlist";
import { ownerLabel } from "@/lib/contest-view";
import { formatTimeAgo } from "@/lib/format";
import type { Contest, ContestEntry } from "@/types";
import ConstellationThumb from "./constellation-thumb";
import LikeHeart from "./like-heart";
import SaveToPlaylistButton from "./save-to-playlist-button";

const THUMB = 194;

interface EntryCardProps {
  entry: ContestEntry;
  contest: Contest;

  meEmail: string | null;
}

export default function EntryCard({ entry, contest, meEmail }: EntryCardProps) {
  const like = useContestLike(contest, meEmail);
  const isMine = meEmail != null && entry.ownerEmail === meEmail;

  const saver = useSaveContestToPlaylist(meEmail != null);

  return (
    <article className={`flex flex-col gap-2 rounded-box-sm border p-2 ${isMine ? "border-teal/40 bg-teal/[.05]" : "border-line bg-white/[.03]"}`}>
      <ConstellationThumb tracks={entry.tracks} closed={entry.closed} size={THUMB} className="self-center" />
      <div className="flex items-center justify-between gap-1.5">
        <p className="min-w-0 truncate text-sm font-medium">{entry.title}</p>
        {isMine ? <Tag tone="teal">내 출품</Tag> : entry.rank != null ? <Tag title="순위">{entry.rank}위</Tag> : null}
      </div>
      <p className="truncate text-[13px] text-ink-3">
        @{ownerLabel(entry.ownerEmail, entry.ownerNickname)} · {entry.musicCnt}곡 · {formatTimeAgo(entry.createdAt)}
      </p>
      {entry.aiComment && <p className="line-clamp-2 text-xs leading-relaxed text-ink-3">“{entry.aiComment}”</p>}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="num text-xs">
          <b className="text-ink">{entry.score ?? "–"}</b>
          <span className="text-ink-4"> AI</span>
          {entry.rankScore != null && <span className="text-ink-3"> · 순위 점수 {entry.rankScore.toFixed(1)}</span>}
        </span>
        <div className="flex items-center gap-1">
          <LikeHeart
            entry={entry}
            disabled={!like.canLike(entry) || like.pending}
            title={isMine ? "내 작품에는 좋아요를 줄 수 없어요" : entry.likedByMe ? "좋아요 거두기" : "좋아요"}
            onClick={() => like.toggle(entry)}
          />
          <SaveToPlaylistButton saved={saver.isSaved(entry.artworkId)} pending={saver.savingId === entry.artworkId} empty={entry.tracks.length === 0} onClick={() => saver.save(entry)} />
        </div>
      </div>
    </article>
  );
}
