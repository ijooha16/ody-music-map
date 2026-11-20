"use client";

import CenterDialog from "@/components/common/center-dialog";
import EmptyState from "@/components/common/empty-state";
import SkeletonRows from "@/components/common/skeleton-rows";
import { useAddPlaylistItemMutation } from "@/hooks/mutations/use-add-playlist-item-mutation";
import { useMyPlaylistsQuery } from "@/hooks/queries/use-my-playlists-query";
import CreatePlaylistForm from "./create-playlist-form";

interface AddToPlaylistDialogProps {
  musicId: number;
  onDone: () => void;
}

export default function AddToPlaylistDialog({ musicId, onDone }: AddToPlaylistDialogProps) {
  const { data, isPending } = useMyPlaylistsQuery();
  const add = useAddPlaylistItemMutation();

  const handleAdd = (playlistId: number) => {
    add.mutate({ playlistId, musicId }, { onSuccess: onDone });
  };

  return (
    <CenterDialog title="플레이리스트에 추가" onClose={onDone} flush>
      <div className="max-h-64 overflow-y-auto p-1.5">
        {isPending && <SkeletonRows count={3} thumb="none" sub={false} />}
        {data && data.length === 0 && <EmptyState message="아직 플레이리스트가 없어요." />}
        {data?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleAdd(p.id)}
            disabled={add.isPending}
            className="flex w-full items-center justify-between rounded-box-sm border border-transparent px-[9px] py-2 text-left text-sm transition-colors hover:border-line hover:bg-white/[.055]"
          >
            <span className="truncate">{p.playlistName}</span>
            <span className="num text-[12.5px] text-ink-3">{p.itemCount}곡 · ＋</span>
          </button>
        ))}
      </div>
      <div className="border-t border-line p-2.5">
        <CreatePlaylistForm onCreated={(p) => handleAdd(p.id)} />
      </div>
    </CenterDialog>
  );
}
