"use client";

import Button from "@/components/common/button";
import { PlayIcon } from "@/components/common/icons";
import Tag from "@/components/common/tag";
import { useLikePlaylistMutation } from "@/hooks/mutations/use-like-playlist-mutation";
import { formatDuration } from "@/lib/format";
import { usePlayPlaylist } from "@/hooks/use-play-playlist";
import type { PlaylistDetail } from "@/types";

export default function PlaylistHeader({ playlist }: { playlist: PlaylistDetail }) {
  const like = useLikePlaylistMutation();

  const playPlaylist = usePlayPlaylist(playlist);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-display text-[17px] font-semibold">{playlist.playlistName}</h3>
      <p className="lbl">
        {playlist.ownerNickname ?? "-"} · {playlist.itemCount}곡 · {formatDuration(playlist.totalDuration)}
      </p>
      <div className="flex flex-wrap gap-[5px]">
        {playlist.moodTags.slice(0, 3).map((m) => (
          <Tag key={m} tone="violet">
            {m}
          </Tag>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => playPlaylist()} disabled={playlist.items.length === 0}>
          <PlayIcon size={15} /> 순차 재생
        </Button>

        <Button active={playlist.isLiked} onClick={() => like.mutate({ playlistId: playlist.id, liked: !playlist.isLiked })} disabled={like.isPending}>
          {playlist.isLiked ? "♥" : "♡"} <span className="num">{playlist.likeCnt ?? 0}</span>
        </Button>
      </div>
    </div>
  );
}
