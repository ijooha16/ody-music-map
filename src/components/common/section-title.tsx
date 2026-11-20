import type { ReactNode } from "react";

interface SectionTitleProps {
  children: ReactNode;

  aside?: ReactNode;

  tone?: "label" | "sentence";
}

export default function SectionTitle({ children, aside, tone = "label" }: SectionTitleProps) {
  return (
    <div className="flex items-baseline justify-between gap-2.5">
      <h3 className={tone === "sentence" ? "text-md font-medium text-ink-2" : "lbl"}>{children}</h3>
      {aside && <div className="text-xs text-ink-3">{aside}</div>}
    </div>
  );
}
