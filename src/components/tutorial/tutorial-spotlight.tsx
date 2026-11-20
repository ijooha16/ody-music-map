"use client";

import { useEffect, useState } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;

  ring: boolean;
}

const PAD = 9;

interface Targets {
  spotlight: readonly string[];
}

function find(targets: readonly string[]): Rect | null {
  for (const t of targets) {
    if (t === "map") {
      const c = document.querySelector("canvas")?.getBoundingClientRect();
      const f = getMapEngine()?.freeRect();
      if (!c || !f) continue;
      return { x0: c.left + f.x0, y0: c.top + f.y0, x1: c.left + f.x1, y1: c.top + f.y1, ring: false };
    }
    const r = document.querySelector(`[data-tutorial="${t}"]`)?.getBoundingClientRect();
    if (r?.width && r.height) return { x0: r.left - PAD, y0: r.top - PAD, x1: r.right + PAD, y1: r.bottom + PAD, ring: true };
  }
  return null;
}

const BEAT_PX = 9;
const beat = (w: number, h: number) => {
  const amp = Math.min(0.18, Math.max(0.045, BEAT_PX / Math.max(1, Math.min(w, h))));
  return { "--tbeat-lo": 1 - amp, "--tbeat-hi": 1 + amp } as React.CSSProperties;
};

const same = (a: Rect | null, b: Rect | null) =>
  a && b ? a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1 : a === b;

export default function TutorialSpotlight({ spotlight }: Targets) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = find(spotlight);
      setRect((prev) => (same(prev, next) ? prev : next));
    };
    tick();
    const id = window.setInterval(tick, 250);
    window.addEventListener("resize", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", tick);
    };
  }, [spotlight]);

  const dim = "pointer-events-none fixed bg-void/40";

  if (!rect) return <div className={`${dim} inset-0`} />;

  const w = rect.x1 - rect.x0;
  const h = rect.y1 - rect.y0;
  return (
    <>
          <div className={dim} style={{ left: 0, right: 0, top: 0, height: rect.y0 }} />
          <div className={dim} style={{ left: 0, right: 0, top: rect.y1, bottom: 0 }} />
          <div className={dim} style={{ left: 0, top: rect.y0, width: rect.x0, height: h }} />
          <div className={dim} style={{ left: rect.x1, right: 0, top: rect.y0, height: h }} />

      {rect.ring && (
        <div
          className="pointer-events-none fixed border-2 border-teal shadow-[0_0_28px_6px_rgba(79,227,206,.45)]"

          style={{ left: rect.x0, top: rect.y0, width: w, height: h, borderRadius: Math.min(26, w / 2, h / 2) }}
        >

          <i className="animate-tbeat absolute -inset-1 block rounded-[inherit] border-[3px] border-teal" style={beat(w, h)} />
        </div>
      )}
    </>
  );
}
