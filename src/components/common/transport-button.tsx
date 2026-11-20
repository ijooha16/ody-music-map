"use client";

import type { ReactNode } from "react";

interface TransportButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;

  dimmed?: boolean;
  primary?: boolean;

  size?: "sm" | "md" | "lg";

  bright?: boolean;
  children: ReactNode;
}

export default function TransportButton({ label, onClick, disabled, dimmed, primary, size = "sm", bright = false, children }: TransportButtonProps) {
  const dim = size === "lg" ? "h-11 w-11" : primary || size === "md" ? "h-9 w-9" : "h-8 w-8";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={dimmed || undefined}
      className={`grid shrink-0 place-items-center rounded-pill transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-35 ${dimmed ? "opacity-35" : ""} ${dim} ${primary ? "bg-white/10 text-ink" : bright ? "text-ink" : "text-ink-2"} ${
        disabled ? "" : primary ? "hover:grad-bg hover:text-void" : "hover:bg-white/[.08] hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
