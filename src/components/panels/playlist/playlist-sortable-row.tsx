"use client";

import { useSortable } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import IconButton from "@/components/common/icon-button";
import { GripIcon } from "@/components/common/icons";
import TrackRow from "@/components/common/track-row";
import type { PlaylistItemWithMusic } from "@/types";

interface PlaylistSortableRowProps {
  item: PlaylistItemWithMusic;

  index: number;
  active: boolean;

  editable: boolean;
  onClick: () => void;

  actions: ReactNode;
}

export default function PlaylistSortableRow({ item, index, active, editable, onClick, actions }: PlaylistSortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.musicId,
    disabled: !editable,
  });

  const style = {
    transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined,
    transition,

    zIndex: isDragging ? 1 : undefined,
    opacity: isDragging ? 0.85 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TrackRow
        index={index}
        title={item.music.title}
        artist={item.music.artist}
        duration={item.music.duration}
        active={active}
        onClick={onClick}
        actions={
          <>
            {editable && (
              <IconButton
                label="끌어서 순서 바꾸기"
                size={26}

                ref={setActivatorNodeRef}
                className="cursor-grab touch-none active:cursor-grabbing"

                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <GripIcon size={15} />
              </IconButton>
            )}
            {actions}
          </>
        }
      />
    </div>
  );
}
