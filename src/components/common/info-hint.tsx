"use client";

import { useState, type ReactNode } from "react";
import { InfoIcon } from "@/components/common/icons";

export default function InfoHint({ label, children }: { label: string; children: ReactNode }) {
  const [pinned, setPinned] = useState(false);
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={pinned}
        onClick={() => setPinned((v) => !v)}
        onBlur={() => setPinned(false)}
        className={`grid h-[18px] w-[18px] place-items-center rounded-pill transition-colors duration-fast ${pinned ? "text-teal" : "text-ink-4 hover:text-ink-2"}`}
      >
        <InfoIcon size={16} />
      </button>
      <span
        role="tooltip"
        className={`glass pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 w-[230px] -translate-x-1/2 rounded-box-sm! px-3 py-2 text-[13.5px] leading-[1.55] font-normal text-ink-2 transition-opacity duration-fast ${
          pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
