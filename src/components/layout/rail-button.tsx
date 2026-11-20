"use client";

import type { ReactNode } from "react";

interface RailButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  badge?: number;

  disabled?: boolean;

  title?: string;

  "data-tutorial"?: string;

  bare?: boolean;
}

export default function RailButton({ label, active, onClick, children, badge, disabled = false, title, "data-tutorial": dataTutorial, bare = false }: RailButtonProps) {
  const look = bare
    ? `h-8 w-8 drop-shadow-[0_1px_3px_rgb(0_0_0/0.7)] [&_svg]:size-6 ${active ? "text-teal" : "text-ink"}`
    : `h-10 w-10 ${active ? "grad-bg text-void shadow-glow-azure" : disabled ? "text-ink-3" : "text-ink-3 hover:bg-white/[.07] hover:text-ink"}`;
  return (
    <button
      type="button"
      title={title ?? label}
      data-tutorial={dataTutorial}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`relative grid place-items-center rounded-pill transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-40 ${look}`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className={`num absolute top-0.5 right-0.5 grid h-[15px] min-w-[15px] place-items-center rounded-pill px-1 text-[12px] font-semibold ${
            active ? "bg-void text-teal" : "bg-teal text-[#04211d] shadow-[0_0_0_2px_#05080f]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
