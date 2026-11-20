export const COVER_SHADE = { min: 0.35, max: 0.8 } as const;

export function shadeForLuma(luma: number): number {
  const t = Math.min(1, Math.max(0, Number.isFinite(luma) ? luma : 0));
  return COVER_SHADE.min + (COVER_SHADE.max - COVER_SHADE.min) * t;
}

export function canvasLuma(canvas: HTMLCanvasElement): number | null {
  try {
    const s = document.createElement("canvas");
    s.width = 8;
    s.height = 8;
    const g = s.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(canvas, 0, 0, 8, 8);
    const d = g.getImageData(0, 0, 8, 8).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4) / 255;
  } catch {
    return null;
  }
}
