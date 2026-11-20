"use client";

import { useEffect, useRef } from "react";
import { MAP_COVERED } from "@/constants";
import { useMapCoverStore } from "@/stores/use-map-cover-store";
import { usePlayerStore } from "@/stores/use-player-store";
import type { MapEngine } from "./engine/map-engine";
import { drawMap, settleAppear } from "./render/draw-map";

interface MapCanvasProps {
  engine: MapEngine;
  width: number;
  height: number;
}

export default function MapCanvas({ engine, width, height }: MapCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    engine.setSize(width, height);
  }, [engine, width, height]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d", { alpha: false });
    if (!g) return;
    let raf = 0;

    let stepped = 0;

    let skipped = false;

    let drawnSongs: MapEngine["songs"] | null = null;

    let moved = false;

    let catchUp = 0;
    const frame = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(1, Math.round(engine.W));
      const H = Math.max(1, Math.round(engine.H));

      let cleared = false;
      if (cv.width !== W * dpr || cv.height !== H * dpr) {
        cv.width = W * dpr;
        cv.height = H * dpr;
        cleared = true;
      }

      if (useMapCoverStore.getState().covers > 0 && !cleared && drawnSongs === engine.songs && catchUp === 0) {
        if (now - stepped >= MAP_COVERED.engineStepMs) {
          const { cx, cy, s } = engine.cam;
          engine.frame(now);
          stepped = now;
          if (engine.cam.cx !== cx || engine.cam.cy !== cy || engine.cam.s !== s) moved = true;
          else if (moved) {
            moved = false;
            catchUp = 2;
          }
        }
        skipped = true;
      } else {
        if (catchUp > 0) catchUp--;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        engine.frame(now);

        if (skipped) settleAppear(engine.time);
        skipped = false;
        drawMap(g, engine, usePlayerStore.getState().currentMusicId);
        drawnSongs = engine.songs;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}
