import type { CSSProperties, ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  tone?: "default" | "teal" | "violet" | "warn";

  color?: string;

  title?: string;
}

const TONE_CLASS = {
  default: "text-ink-2 border-line bg-white/[.03]",
  teal: "text-teal border-teal/30 bg-teal/[.07]",
  violet: "text-violet border-violet/30 bg-violet/[.07]",
  warn: "text-warn border-warn/30 bg-warn/[.07]",
} as const;

export default function Tag({ children, tone = "default", color, title }: TagProps) {
  const style: CSSProperties | undefined = color
    ? { color, borderColor: color.replace(")", ",.45)").replace("rgb(", "rgba("), background: color.replace(")", ",.09)").replace("rgb(", "rgba(") }
    : undefined;
  return (
    <span
      title={title}
      style={style}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-[9px] py-1 text-xs ${color ? "" : TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
