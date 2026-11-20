import { DEMO } from "@/constants/demo";

export const GENRE_COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [79, 227, 206],
  [56, 198, 255],
  [134, 169, 255],
  [160, 140, 255],
  [185, 120, 255],
  [224, 112, 232],
  [255, 123, 176],
  [255, 139, 107],
  [255, 92, 122],
  [123, 227, 156],
  [126, 138, 158], // 무장르 — 장르 정보가 없는 곡. 채도를 뺀 회청색이라 "값이 없다"로 읽힌다
];

export function genreIdx(genreId: number): number {
  return Math.abs(genreId) % GENRE_COLORS.length;
}

export function genreRgb(genreId: number): readonly [number, number, number] {
  return GENRE_COLORS[genreIdx(genreId)];
}

export function rgba(rgb: readonly [number, number, number], a: number): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export function genreColor(genreId: number): string {
  return rgba(genreRgb(genreId), 1);
}

export const PALETTE = {
  void: "#02040a",
  void2: "#05080f",
  ink: "#e9f1ff",
  ink2: "#93a4c4",
  ink3: "#7688a8",
  ink4: "#586c93",
  teal: "#4fe3ce",
  azure: "#5c9dff",
  violet: "#a67cff",
  warn: "#ffc46b",
  bad: "#ff7a8a",
} as const;

export const MAP_COLORS = {
  background: DEMO ? "#000" : PALETTE.void,
  me: PALETTE.teal,
  meRing: "rgba(79,227,206,.55)",
  meRingInner: "rgba(79,227,206,.28)",

  meAway: "rgba(166,124,255,.95)",
  meAwayRing: "rgba(166,124,255,.5)",
  meAwayRingInner: "rgba(166,124,255,.26)",
  nearbyLine: "rgba(79,227,206,.28)",
  nearbyNode: "rgba(150,180,240,.42)",
  probeDim: "rgba(4,6,13,.88)",
  routeStops: ["rgba(79,227,206,.95)", "rgba(92,157,255,.95)", "rgba(166,124,255,.95)"],
  stationFill: "#060a14",
  stationStroke: "rgba(233,241,255,.85)",
  stationCurrent: PALETTE.teal,
  labelBg: "rgba(6,10,19,.82)",
  core: "#f2f7ff",
} as const;

export const LAYER_TINTS: ReadonlyArray<readonly [number, number, number]> = [
  [70, 110, 235],
  [220, 90, 170],
  [210, 160, 95],
  [150, 90, 240],
  [80, 200, 230],
  [240, 140, 55],
  [70, 205, 150],
  [235, 110, 140], // 저궤도 — 장밋빛
];

export const LAYER_TINT_MIX = 0.85;

export type StarShape = "halo" | "cross" | "smear" | "diffuse" | "point" | "disc" | "spark";

export interface CloudStyle {
  count: number;
  scale: number;
  alpha: number;
  stretch: number;
}

export const LAYER_THEMES: ReadonlyArray<{
  sky: readonly [readonly [number, number, number], readonly [number, number, number]];
  star: StarShape;
  cloud: CloudStyle;
  wash: number;
}> = [
  { sky: [[4, 8, 26], [1, 2, 7]], star: "halo", cloud: { count: 22, scale: 1.0, alpha: 1.0, stretch: 1 }, wash: 0.45 },

  { sky: [[42, 10, 44], [7, 3, 15]], star: "cross", cloud: { count: 14, scale: 0.7, alpha: 1.2, stretch: 2.2 }, wash: 1 },

  { sky: [[43, 28, 10], [10, 6, 4]], star: "smear", cloud: { count: 18, scale: 1.2, alpha: 0.9, stretch: 2.8 }, wash: 1 },

  { sky: [[26, 11, 58], [5, 3, 15]], star: "diffuse", cloud: { count: 30, scale: 0.8, alpha: 1.5, stretch: 1 }, wash: 1.1 },

  { sky: [[4, 32, 42], [2, 10, 16]], star: "point", cloud: { count: 0, scale: 1, alpha: 0, stretch: 1 }, wash: 0.8 },

  { sky: [[42, 22, 6], [10, 5, 3]], star: "cross", cloud: { count: 6, scale: 1.6, alpha: 0.6, stretch: 1.2 }, wash: 1 },

  { sky: [[4, 36, 28], [2, 12, 9]], star: "disc", cloud: { count: 0, scale: 1, alpha: 0, stretch: 1 }, wash: 0.8 },

  { sky: [[42, 12, 22], [11, 4, 7]], star: "spark", cloud: { count: 10, scale: 1.1, alpha: 0.7, stretch: 3.2 }, wash: 1 },
];

export const LAYER_SKY_ALPHA = 0.85;

export const NEBULA_WASH: ReadonlyArray<{ u: number; v: number; r: number; c: readonly [number, number, number] }> = [
  { u: 0.16, v: 0.2, r: 0.92, c: [44, 102, 214] },
  { u: 0.8, v: 0.16, r: 0.74, c: [92, 157, 255] },
  { u: 0.66, v: 0.8, r: 0.98, c: [112, 66, 206] },
  { u: 0.18, v: 0.84, r: 0.8, c: [33, 140, 162] },
  { u: 0.5, v: 0.48, r: 1.2, c: [70, 84, 198] },
  { u: 0.92, v: 0.55, r: 0.66, c: [150, 90, 235] },
];

const PRETENDARD = '"Pretendard Variable",Pretendard,system-ui,sans-serif';
export const FONTS = {
  body: PRETENDARD,
  mono: PRETENDARD,
  display: PRETENDARD,
} as const;

export const BREAKPOINTS = {
  tablet: 900,
  desk: 900,
} as const;

export const TOUCH_TARGET_MIN = 44;

export const RIGHT_PANEL_W = 376;

export const SHEET_RADIUS_PX = 30;

export const SHEET_SNAP_PX = { 1: 102, 2: 238, 3: 238 } as const;

export const SHEET_PEEK_TOP_PX = 20;

export const SHEET_HEAD_PX = 70;
