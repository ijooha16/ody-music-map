interface ProgressBarProps {
  percent: number;
  label?: string;

  valueText?: string;

  code?: string;
}

export default function ProgressBar({ percent, label, valueText, code }: ProgressBarProps) {
  const p = Math.min(100, Math.max(3, percent));
  return (
    <div className="grid grid-cols-[1fr_76px_34px] items-center gap-[9px]">

      <span className="truncate text-sm text-ink-2">
        {label}
        {code && <span className="ml-1 font-mono text-[13px] text-ink-4">{code}</span>}
      </span>
      <span className="h-1 overflow-hidden rounded-pill bg-white/[.08]">
        <i className="grad-bg block h-full rounded-pill" style={{ width: `${p}%` }} />
      </span>
      <span className="num text-right text-[13.5px] text-ink-3">{valueText ?? `${Math.round(percent)}%`}</span>
    </div>
  );
}
