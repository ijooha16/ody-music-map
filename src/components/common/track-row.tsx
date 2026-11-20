import type { ReactNode } from "react";
import { formatDuration } from "@/lib/format";

interface TrackRowProps {
  title: string;
  artist: string | null;

  index?: number;
  duration?: number | null;

  meta?: string | null;

  right?: ReactNode;

  active?: boolean;

  dotColor?: string;

  actions?: ReactNode;
  onClick?: () => void;
}

export default function TrackRow({ title, artist, index, duration, meta, right, active = false, dotColor, actions, onClick }: TrackRowProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}

      onKeyDown={onClick ? (e) => e.target === e.currentTarget && e.key === "Enter" && onClick() : undefined}
      className={`group flex w-full items-center gap-2.5 rounded-box-sm border px-[9px] py-2 text-left transition-colors duration-fast ${
        active ? "border-teal/30 bg-teal/[.08]" : "border-transparent"
      } ${onClick ? "cursor-pointer hover:border-line hover:bg-white/[.055]" : ""}`}
    >
      {index != null && <span className="num w-4 shrink-0 text-right text-[12.5px] text-ink-4">{index}</span>}
      {dotColor && <span className="h-[7px] w-[7px] shrink-0 rounded-pill" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-[1.3]">{title}</p>
        <p className="truncate text-xs text-ink-3">
          {artist ?? "Unknown"}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      {right != null ? (
        <span className="num shrink-0 text-right text-[12.5px] leading-[1.45] text-ink-3">{right}</span>
      ) : duration != null ? (
        <span className="num shrink-0 text-[12.5px] text-ink-3">{formatDuration(duration)}</span>
      ) : null}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
