"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;

  hint?: ReactNode;
  error?: string | null;

  trailing?: ReactNode;
}

export default function AuthField({ label, hint, error, trailing, ...input }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-medium text-ink-2">{label}</span>
      <span
        className={`flex items-center gap-2 rounded-[13px] border bg-white/[.03] px-3.5 py-3 transition-colors focus-within:bg-white/[.05] ${
          error ? "border-bad/60" : "border-line focus-within:border-teal/60"
        }`}
      >
        <input className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-4" autoComplete="off" spellCheck={false} {...input} />
        {trailing}
      </span>
      {(error || hint) && <span className={`mt-1.5 block text-[13px] leading-[1.5] ${error ? "text-bad" : "text-ink-3"}`}>{error ?? hint}</span>}
    </label>
  );
}
