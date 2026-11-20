import { SKETCH_STEPS, type SketchStep } from "@/constants";

export default function SketchSteps({ current }: { current: SketchStep }) {
  const at = SKETCH_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex flex-col" aria-label="진행 단계">
      {SKETCH_STEPS.map((s, i) => {
        const done = i < at;
        const now = i === at;
        const last = i === SKETCH_STEPS.length - 1;
        return (
          <li key={s.key} className="flex gap-2" aria-current={now ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={`num flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] leading-none font-semibold ${
                  now ? "border-teal bg-teal text-void" : done ? "border-line-2 bg-white/[.08] text-ink-4" : "border-line-2 text-ink-4"
                }`}
              >
                {now || done ? "✓" : i + 1}
              </span>
              {!last && <span className="min-h-6 w-px flex-1 bg-line-2" />}
            </div>
            <span className={`mb-4 text-[13px] leading-[18px] ${now ? "font-medium text-teal" : done ? "text-ink-3" : "text-ink-4"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
