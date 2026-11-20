import type { ContestEntry } from "@/types";

interface LikeHeartProps {
  entry: ContestEntry;
  disabled: boolean;
  title: string;
  onClick: () => void;
}

export default function LikeHeart({ entry, disabled, title, onClick }: LikeHeartProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`flex items-center gap-0.5 px-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${entry.likedByMe ? "text-bad" : "text-ink-2 hover:text-ink"}`}
    >
      <span aria-hidden>{entry.likedByMe ? "♥" : "♡"}</span>
      <span className="num text-xs">{entry.likeCnt}</span>
    </button>
  );
}
