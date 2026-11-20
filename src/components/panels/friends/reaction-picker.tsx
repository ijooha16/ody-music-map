"use client";

import { REACTIONS, type ReactionKey } from "@/constants";

interface ReactionPickerProps {
  onPick: (key: ReactionKey) => void;

  horizontal?: boolean;
}

export default function ReactionPicker({ onPick, horizontal = false }: ReactionPickerProps) {
  return (
    <div className={`glass animate-rpop flex gap-[5px] rounded-pill! p-1 ${horizontal ? "flex-row" : "flex-col"}`}>
      {REACTIONS.map((r) => (
        <button
          key={r.key}
          type="button"
          title={r.label}
          onClick={() => onPick(r.key)}
          className="grid h-8 w-8 place-items-center rounded-pill text-[17px] leading-none transition-all duration-fast hover:scale-[1.12] hover:bg-white/[.12]"
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
