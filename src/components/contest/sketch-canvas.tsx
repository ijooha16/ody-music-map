"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { SKETCH_HIT_PX } from "@/constants";
import { FONTS, PALETTE } from "@/constants/design-tokens";
import { constellationLayout, drawConstellation } from "@/lib/constellation-draw";
import type { ContestTrack, SketchPoint } from "@/types";

interface SketchCanvasProps {
  points: SketchPoint[];
  closed: boolean;

  result: ContestTrack[] | null;
  onAdd: (p: SketchPoint) => void;
  onRemove: (index: number) => void;

  highlight?: number | null;

  readOnly?: boolean;

  onToggleClose?: () => void;
}

const RESULT_PAD = 0.12;

const BACKDROP: { x: number; y: number; r: number }[] = Array.from({ length: 70 }, (_, i) => {
  const a = i * 2.399963;
  const rr = Math.sqrt((i + 0.5) / 70) * 0.5;
  return { x: 0.5 + Math.cos(a) * rr, y: 0.5 + Math.sin(a) * rr, r: 0.6 + ((i * 7919) % 10) / 12 };
});

export default function SketchCanvas({ points, closed, result, onAdd, onRemove, highlight = null, readOnly = false, onToggleClose }: SketchCanvasProps) {
  const [nearFirst, setNearFirst] = useState(false);
  const canClose = !readOnly && !!onToggleClose && points.length >= 3;
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => setSize(Math.round(entry.contentRect.width)));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !size) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "rgba(201,211,255,.28)";
    for (const b of BACKDROP) {
      ctx.beginPath();
      ctx.arc(b.x * size, b.y * size, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const P = points.map((p) => [p.x * size, p.y * size] as const);
    const faint = result != null;
    if (P.length) {
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = faint ? "rgba(92,157,255,.18)" : "rgba(92,157,255,.7)";
      ctx.beginPath();
      P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (closed && P.length > 2) ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = faint ? "rgba(233,241,255,.25)" : PALETTE.ink;
      for (const [x, y] of P) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!faint) {
        ctx.strokeStyle = PALETTE.teal;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(P[0][0], P[0][1], 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (result) drawConstellation(ctx, result, closed, size, size, { starR: 3.2, lineWidth: 1.5, pad: RESULT_PAD });

    const at = result ? constellationLayout(result, size, size, RESULT_PAD) : P;
    ctx.font = `600 10.5px ${FONTS.body}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    at.forEach(([x, y], i) => {
      const on = highlight === i;
      ctx.fillStyle = on ? PALETTE.teal : "rgba(201,211,255,.62)";
      ctx.fillText(String(i + 1), x + 6, y - 7);
      if (on) {
        ctx.strokeStyle = PALETTE.teal;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    if (nearFirst && canClose && !result && P.length) {
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(P[0][0], P[0][1], SKETCH_HIT_PX, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [points, closed, result, size, highlight, nearFirst, canClose]);

  const hitsFirst = (x: number, y: number, width: number) => points.length > 0 && Math.hypot(points[0].x - x, points[0].y - y) <= SKETCH_HIT_PX / width;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const hitR = SKETCH_HIT_PX / r.width;

      if (canClose && hitsFirst(x, y, r.width)) return onToggleClose?.();
      const hit = points.findIndex((p) => Math.hypot(p.x - x, p.y - y) <= hitR);
      if (hit >= 0) onRemove(hit);
      else onAdd({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hitsFirst 는 points 만 읽는다
    [points, onAdd, onRemove, readOnly, canClose, onToggleClose],
  );

  return (
    <canvas
      ref={ref}
      onClick={handleClick}
      onMouseMove={(e) => {
        if (!canClose) return;
        const r = e.currentTarget.getBoundingClientRect();
        const near = hitsFirst((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, r.width);
        if (near !== nearFirst) setNearFirst(near);
      }}
      onMouseLeave={() => setNearFirst(false)}
      aria-label="별자리 그리기 캔버스"
      className={`aspect-square w-full ${readOnly ? "cursor-default" : nearFirst && canClose ? "cursor-pointer" : "cursor-crosshair"} rounded-box-sm border border-line bg-[radial-gradient(ellipse_at_50%_45%,rgb(22_28_52)_0%,var(--color-void)_72%)]`}
    />
  );
}
