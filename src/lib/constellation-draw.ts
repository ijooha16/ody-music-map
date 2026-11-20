import { PALETTE } from "@/constants/design-tokens";
import type { ContestTrack } from "@/types";

interface DrawOptions {
  dim?: boolean;

  starR?: number;
  lineWidth?: number;

  pad?: number;
}

export function constellationLayout(tracks: readonly ContestTrack[], w: number, h: number, pad = 0.14): (readonly [number, number])[] {
  if (!tracks.length) return [];
  const xs = tracks.map((t) => t.x);
  const ys = tracks.map((t) => t.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const k = (Math.min(w, h) * (1 - pad * 2)) / span;
  return tracks.map((t) => [w / 2 + (t.x - cx) * k, h / 2 - (t.y - cy) * k] as const);
}

export function drawConstellation(ctx: CanvasRenderingContext2D, tracks: ContestTrack[], closed: boolean, w: number, h: number, opt: DrawOptions = {}) {
  const { dim = false, starR = 2.6, lineWidth = 1.3, pad = 0.14 } = opt;
  if (!tracks.length) return;
  const P = constellationLayout(tracks, w, h, pad);

  const line = dim ? "rgba(88,106,139,.6)" : "rgba(92,157,255,.7)";
  const star = dim ? PALETTE.ink3 : PALETTE.ink;
  const glow = dim ? "transparent" : "rgba(79,227,206,.9)";

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = line;
  ctx.lineJoin = "round";
  ctx.beginPath();
  P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed && P.length > 2) ctx.closePath();
  ctx.stroke();

  ctx.shadowColor = glow;
  ctx.shadowBlur = dim ? 0 : 6;
  ctx.fillStyle = star;
  for (const [x, y] of P) {
    ctx.beginPath();
    ctx.arc(x, y, starR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.strokeStyle = dim ? PALETTE.ink4 : PALETTE.teal;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(P[0][0], P[0][1], starR + 3.5, 0, Math.PI * 2);
  ctx.stroke();
}
