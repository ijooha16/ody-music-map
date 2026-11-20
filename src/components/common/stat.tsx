import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;

  numeric?: boolean;
}

export default function Stat({ label, value, numeric = false }: StatProps) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/[.045] py-[5px] text-md last:border-b-0">
      <dt className="shrink-0 text-sm text-ink-3">{label}</dt>
      <dd className={`m-0 min-w-0 text-right ${numeric ? "num" : ""}`}>{value}</dd>
    </div>
  );
}
