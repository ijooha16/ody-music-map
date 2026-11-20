"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import EmptyState from "@/components/common/empty-state";
import IconButton from "@/components/common/icon-button";
import { CloseIcon, PlayIcon } from "@/components/common/icons";
import SectionTitle from "@/components/common/section-title";
import { useRemovePlaylistItemMutation } from "@/hooks/mutations/use-remove-playlist-item-mutation";
import { moveItem, useReorderPlaylistItemsMutation } from "@/hooks/mutations/use-reorder-playlist-items-mutation";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { usePlayPlaylist } from "@/hooks/use-play-playlist";
import type { PlaylistDetail } from "@/types";
import PlaylistSortableRow from "./playlist-sortable-row";

interface PlaylistTrackListProps {
  playlist: PlaylistDetail;

  editable: boolean;
}

export default function PlaylistTrackList({ playlist, editable }: PlaylistTrackListProps) {
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const openSong = usePanelStore((s) => s.openSongFromList);
  const remove = useRemovePlaylistItemMutation();
  const reorder = useReorderPlaylistItemsMutation();
  const playPlaylist = usePlayPlaylist(playlist);

  const ids = playlist.items.map((it) => it.musicId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = moveItem(ids, ids.indexOf(Number(active.id)), ids.indexOf(Number(over.id)));
    if (next === ids) return;
    reorder.mutate({ playlistId: playlist.id, musicIds: [...next] });
  };

  const playFrom = (index: number) => {
    rememberMusicHints(playlist.items.map((it) => it.music));

    playPlaylist(index);
  };

  return (
    <div className="flex flex-col gap-2">
      <SectionTitle aside={`${playlist.itemCount}곡`}>곡 목록</SectionTitle>
      {playlist.items.length === 0 ? (
        <EmptyState message="아직 담은 곡이 없습니다. 지도에서 곡을 고르고 ＋ 플리 를 누르세요." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="-mx-1.5 flex flex-col gap-0.5">
              {playlist.items.map((it, i) => (
                <PlaylistSortableRow
                  key={it.musicId}
                  item={it}
                  index={i + 1}
                  active={it.musicId === currentMusicId}
                  editable={editable}
                  onClick={() => {
                    openSong(it.musicId);
                    playFrom(i);
                  }}
                  actions={
                    <>
                      <IconButton
                        label="이 곡부터 재생"
                        size={26}
                        onClick={(e) => {
                          e.stopPropagation();
                          playFrom(i);
                        }}
                      >
                        <PlayIcon size={15} />
                      </IconButton>
                      {editable && (
                        <IconButton
                          label="삭제"
                          size={26}
                          disabled={remove.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            remove.mutate({ playlistId: playlist.id, musicId: it.musicId });
                          }}
                        >
                          <CloseIcon size={15} />
                        </IconButton>
                      )}
                    </>
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
