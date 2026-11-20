"use client";

import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from "chart.js";
import { useEffect, useRef } from "react";
import { FONTS, PALETTE } from "@/constants/design-tokens";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export interface PcRow {
  axis: number;

  left: string;

  right: string;

  sd: number;
}

const FULL_SD = 3;

const BAR = 13;
const ROW = 29;

export default function SongPcChart({ rows }: { rows: PcRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = rows;

    const on = (i: number, side: "left" | "right") => (side === "right" ? data[i].sd >= 0 : data[i].sd < 0);

    const tickColor = (side: "left" | "right") => (ctx: { index: number }) => (on(ctx.index, side) ? PALETTE.ink2 : PALETTE.ink4);

    const tickFont = (side: "left" | "right") => (ctx: { index: number }) => ({ family: FONTS.body, size: on(ctx.index, side) ? 13 : 11.5 });

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map((r) => r.left),
        datasets: [
          {
            data: data.map((r) => Math.max(-FULL_SD, Math.min(FULL_SD, r.sd))),
            backgroundColor: data.map((r) => (r.sd >= 0 ? PALETTE.teal : PALETTE.violet)),
            borderRadius: 3,
            barThickness: BAR,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 720, easing: "easeOutQuart" },
        scales: {
          x: {
            min: -FULL_SD,
            max: FULL_SD,
            border: { display: false },

            grid: { color: (ctx) => (ctx.tick.value === 0 ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.05)"), tickLength: 0 },
            ticks: { stepSize: FULL_SD, color: PALETTE.ink4, font: { family: FONTS.mono, size: 11 }, padding: 3, callback: (v) => `${v}σ` },
          },

          y: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: tickColor("left"), font: tickFont("left"), crossAlign: "far", padding: 4 },
          },

          y1: {
            position: "right",
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: tickColor("right"),
              font: tickFont("right"),
              crossAlign: "near",
              padding: 4,
              callback: (_v, i) => data[i].right,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "rgba(10,14,26,.92)",
            borderColor: "rgba(255,255,255,.13)",
            borderWidth: 1,
            titleFont: { family: FONTS.body, size: 12.5 },
            bodyFont: { family: FONTS.mono, size: 12 },
            padding: 8,
            callbacks: {
              title: (items) => {
                const r = data[items[0].dataIndex];
                return r.sd >= 0 ? r.right : r.left;
              },
              label: (item) => {
                const r = data[item.dataIndex];
                return `${Math.abs(r.sd).toFixed(1)}σ · PC${r.axis + 1}`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [rows]);

  return (
    <div style={{ height: rows.length * ROW + 20 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
