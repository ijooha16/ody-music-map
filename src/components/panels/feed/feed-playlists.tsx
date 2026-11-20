"use client";

import { useState } from "react";
import { useDrill } from "@/hooks/use-drill";
import EmptyState from "@/components/common/empty-state";
import IconButton from "@/components/common/icon-button";
import { CloseIcon } from "@/components/common/icons";
import PlaylistRow from "@/components/common/playlist-row";
import SkeletonRows from "@/components/common/skeleton-rows";
import { useDeletePlaylistMutation } from "@/hooks/mutations/use-delete-playlist-mutation";
import { useLikedPlaylistsQuery } from "@/hooks/queries/use-liked-playlists-query";
import { useMyPlaylistsQuery } from "@/hooks/queries/use-my-playlists-query";
import Button from "@/components/common/button";
import CreatePlaylistDialog from "../playlist/create-playlist-dialog";

interface FeedPlaylistsProps {
  email: string | null;
  isMe: boolean;

  kind: "made" | "liked";
}

export default function FeedPlaylists({ email, isMe, kind }: FeedPlaylistsProps) {
  const target = isMe ? null : email;
  const made = kind === "made";

  const mine = useMyPlaylistsQuery(target);
  const liked = useLikedPlaylistsQuery(target);

  const drill = useDrill();
  const remove = useDeletePlaylistMutation();

  const [creating, setCreating] = useState(false);

  const query = made ? mine : liked;
  const rows = query.data ?? [];
  const empty = made ? (isMe ? "아직 만든 플레이리스트가 없어요. 위 버튼으로 하나 만들어 보세요." : "아직 만든 플레이리스트가 없어요.") : "아직 좋아요한 플레이리스트가 없어요.";

  return (
    <div className="flex flex-col gap-2">
      {isMe && made && (
        <Button size="sm" className="self-start" onClick={() => setCreating(true)}>
          ＋ 새 플레이리스트
        </Button>
      )}
      {creating && <CreatePlaylistDialog onClose={() => setCreating(false)} />}
      <div className="-mx-1.5 flex flex-col gap-0.5">
        {query.isPending && <SkeletonRows count={4} />}
        {!query.isPending && rows.length === 0 && <EmptyState message={empty} />}
        {rows.map((playlist) => (
          <PlaylistRow
            key={playlist.id}
            playlist={playlist}
            onClick={() => drill({ panel: "playlist", playlistId: playlist.id })}
            actions={
              isMe && made ? (
                <IconButton
                  label="삭제"
                  size={26}
                  disabled={remove.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove.mutate(playlist.id);
                  }}
                >
                  <CloseIcon size={15} />
                </IconButton>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
