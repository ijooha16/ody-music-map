"use client";

import { useEffect, useRef } from "react";
import { drawConstellation } from "@/lib/constellation-draw";
import type { ContestTrack } from "@/types";

interface ConstellationThumbProps {
  tracks: ContestTrack[];
  closed: boolean;

  size: number;

  dim?: boolean;
  className?: string;
}

export default function ConstellationThumb({ tracks, closed, size, dim = false, className = "" }: ConstellationThumbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawConstellation(ctx, tracks, closed, size, size, { dim, starR: size < 60 ? 1.6 : 2.6, lineWidth: size < 60 ? 1 : 1.3 });
  }, [tracks, closed, size, dim]);
  return <canvas ref={ref} aria-hidden style={{ width: size, height: size }} className={`shrink-0 rounded-box-xs bg-void ${className}`} />;
}
