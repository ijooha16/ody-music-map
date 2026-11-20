export interface MinimapFit {
  s: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export function minimapFit(box: { x0: number; x1: number; y0: number; y1: number }, w: number, h: number, pad: number): MinimapFit {
  const bw = Math.max(box.x1 - box.x0, 1e-6);
  const bh = Math.max(box.y1 - box.y0, 1e-6);
  const s = Math.max(1e-6, Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh));
  return { s, cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2, w, h };
}

export function toMini(f: MinimapFit, x: number, y: number): { x: number; y: number } {
  return { x: f.w / 2 + (x - f.cx) * f.s, y: f.h / 2 - (y - f.cy) * f.s };
}

export function fromMini(f: MinimapFit, px: number, py: number): { x: number; y: number } {
  return { x: f.cx + (px - f.w / 2) / f.s, y: f.cy - (py - f.h / 2) / f.s };
}
