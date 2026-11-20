"use client";

import { useMemo, useState } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { ChevronDownIcon } from "@/components/common/icons";
import InfoHint from "@/components/common/info-hint";
import ProgressBar from "@/components/common/progress-bar";
import SectionTitle from "@/components/common/section-title";
import { pcAxisPair } from "@/constants";
import SongPcChart, { type PcRow } from "./song-pc-chart";

interface SongPcListProps {
  items: { axis: number; value: number }[];
}

const TOP = 5;

const FULL_SD = 3;

export default function SongPcList({ items }: SongPcListProps) {
  const [open, setOpen] = useState(false);
  const stats = getMapEngine()?.pcStats();

  const rows = useMemo<PcRow[]>(
    () =>
      items
        .map((p) => {
          const pair = pcAxisPair(p.axis);
          return pair && {
            axis: p.axis,
            left: pair[0],
            right: pair[1],

            sd: stats ? (p.value - stats.mean[p.axis]) / stats.sd[p.axis] : p.value,
          };
        })
        .filter((p): p is PcRow => p != null)
        .sort((a, b) => Math.abs(b.sd) - Math.abs(a.sd)),
    [items, stats],
  );
  const top = useMemo(() => rows.slice(0, TOP), [rows]);
  const rest = useMemo(() => rows.slice(TOP), [rows]);

  if (!rows.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <SectionTitle tone="sentence" aside={`강한 특징 ${open ? rows.length : top.length}/${rows.length}`}>
        이 곡은 이런 소리예요!{" "}
        <InfoHint label="소리 특징 설명">
          <b className="font-medium text-ink">소리 특징</b>은 같은 겹의 다른 곡들과 견줘 이 곡이 유난히 한쪽으로 쏠린 축이에요. 세게 쏠린 축부터 보여 줘요.
        </InfoHint>
      </SectionTitle>
      <SongPcChart rows={top} />
      {rest.length > 0 && (
        <>
          <div className={`grid transition-[grid-template-rows] duration-normal ease-spring ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>

            <div className="overflow-hidden">
              <div className="flex flex-col gap-[7px] pt-0.5">
                {rest.map((pc) => (
                  <ProgressBar
                    key={pc.axis}

                    label={pc.sd >= 0 ? pc.right : pc.left}
                    code={`PC${pc.axis + 1}`}
                    percent={((Math.max(-FULL_SD, Math.min(FULL_SD, pc.sd)) / FULL_SD + 1) / 2) * 100}
                    valueText={`${pc.sd > 0 ? "+" : ""}${pc.sd.toFixed(1)}σ`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "고정 주성분 접기" : "고정 주성분 더보기"}
            className="grid h-7 w-full place-items-center rounded-pill text-ink-3 transition-colors duration-fast hover:bg-white/[.05] hover:text-ink"
          >
            <ChevronDownIcon className={`transition-transform duration-normal ease-spring ${open ? "rotate-180" : ""}`} />
          </button>
        </>
      )}
    </div>
  );
}
