export const LAYER_COUNT = 8;

export const LAYER_SONG_COUNT = 1000;

export const MAP_SONGS_GZIP_LEVEL = 3;

export const GENRE_NAMES = ["앰비언트", "일렉트로닉", "클래식", "재즈", "힙합", "R&B·소울", "팝", "록", "메탈", "포크·컨트리", "무장르"] as const;

export const NO_GENRE_ID = GENRE_NAMES.length - 1;

export const LAYER_NAMES = ["우주", "은하단", "우리은하", "성운", "성단", "태양계", "행성", "저궤도"] as const;

export const LAYER_NAMES_EN = ["UNIVERSE", "GALAXY CLUSTER", "MILKY WAY", "NEBULA", "STAR CLUSTER", "SOLAR SYSTEM", "PLANET", "LOW ORBIT"] as const;

export const LAYER_SUMMARIES = [
  "밝기와 저음의 두께로 나눈 레이어",
  "빽빽한지, 여백이 있는지로 나눈 레이어",
  "화음이 맑은지, 소리가 고른지로 나눈 레이어 — 차이는 약한 편",
  "곡이 긴지, 화음이 자주 바뀌는지로 나눈 레이어",
  "리듬이 촘촘한지, 규칙적인지로 나눈 레이어",
  "소리 크기가 고른 정도로 한 번 더 나눈 레이어 — 차이는 약한 편",
  "리듬이 촘촘한 정도로 한 번 더 나눈 레이어 — 차이는 약한 편",
  "곡 길이로 한 번 더 나눈 레이어",
] as const;

export const LAYER_DEPTH = {
  maxDarken: 0.5,

  maxStarDim: 0.3,

  farFieldAlpha: 3.2,

  maxNebulaFade: 0.45,

  parallax: { near: 0.86, mid: 0.5, far: 0.26 },

  dustAlpha: 2.6,

  fieldStarSize: 1.3,
  fieldStarAlpha: 1.4,
} as const;

export const LAYER_AXES: ReadonlyArray<{ x: readonly [string, string]; y: readonly [string, string] }> = [
  { x: ["어두운", "밝은"], y: ["베이스가 약한", "베이스가 강한"] },

  { x: ["밀도 있는", "여백 있는"], y: ["일관된", "다이내믹한"] },

  { x: ["귀에 걸리는", "매끄러운"], y: ["음량이 들쭉날쭉한", "음량이 고른"] },

  { x: ["윗소리가 닫힌", "윗소리가 트인"], y: ["느긋한", "몰아치는"] },

  { x: ["박자가 촘촘한", "박자가 성긴"], y: ["서브베이스 없는", "서브베이스 묵직한"] },

  { x: ["리듬이 끄는", "코드가 끄는"], y: ["C 계열 조성", "F#(증4도) 계열 조성"] },

  { x: ["몸이 잠잠한", "몸이 들썩이는"], y: ["북적이는", "한산한"] },

  { x: ["화성이 느린", "화성이 빠른"], y: ["중고역이 고요한", "중고역이 요동치는"] },
];

export function pcAxisPair(pcIndex: number): readonly [string, string] | null {
  const ax = LAYER_AXES[Math.floor(pcIndex / 2)];
  if (!ax) return null;
  const pair = pcIndex % 2 === 0 ? ax.x : ax.y;
  return pair[0] ? pair : null;
}

export function axisLine(layer: number) {
  const ax = LAYER_AXES[layer];
  const one = (p: readonly [string, string]) => (p[0] ? `${p[0]} ↔ ${p[1]}` : "미세한 차이");
  return `가로 ${one(ax.x)}   ·   세로 ${one(ax.y)}`;
}

export const NEARBY_COUNT = 10;

export const JOURNEY_MAX_SONGS = 20;

export const CONSTELLATION_MAX_SONGS = 30;

export const DRILL = {
  gateMaxDensity: 1700,

  gateMinZoom: { top: 6, deep: 3 },

  zoomRange: { min: 0.8, max: 24 },

  riseLandZoom: 3.2,

  minInView: 18,

  nearestGrowStep: 1.6,
  nearestGrowMax: 256,

  riseScaleRatio: 0.42,

  pressurePerDelta: 1 / 650,

  pressureDecay: 0.012,

  morphMs: 1000,

  swapMs: 420,

  waitForLayerMs: 1500,

  waitZoom: 0.35,
  waitZoomTauMs: 700,

  dive: {
    out: 4.2,

    in: 0.58,

    outEase: 2.2,
  },

  fitQuantile: 0.97,
  fitRadiusRatio: 0.44,

  deepFit: {
    trim: 0.03,

    fill: 0.9,
  },

  deepZoomOutRatio: 1,
} as const;

export const STAR_VIEW = {
  parallax: 0.32,

  depthSize: 0.3,

  appearMs: 380,

  reappearGapMs: 250,

  memoryCap: 4000,

  forgetMs: 10_000,
} as const;

export const STAR_TWINKLE = {
  minMag: 0.7,

  nth: 3,

  depth: [0.06, 0.14],

  period: [7, 13],
} as const;

export const PAN_LIMIT = { slack: 0.45 } as const;

export const OVERLAY_ZOOM = { min: 0.6, max: 16 } as const;

export const WHEEL_ZOOM = 0.0015;

export const PINCH = {
  minDeltaPx: 2,

  maxStep: 1.25,

  pressureBoost: 3,
} as const;

export const STAR_SIZE = { min: 9, max: 40 } as const;

export const STAR_LOOK = { randomSize: true, randomColor: true } as const;

export const REPRESENTATIVE_GRID_PX = 86;

export const REPRESENTATIVE_COUNT = 40;

export const COVER_COUNT = {
  nearScale: 160,

  far: 12,
  near: 20,

  sizePx: 34,

  minGapPx: 54,

  fillPerFrame: 1,
} as const;

export const FRIEND_MOVE_EPS = 1e-4;

export const MAP_FRIENDS_MAX = 20;

export const ME_FLIGHT = {
  ms: 1500,

  bow: 0.28,

  trail: 0.22,

  hopMs: 700,
} as const;

export const FOLLOW = {
  bow: 0.35,

  viewToPlayMs: 2600,

  playToViewMs: 1600,

  moveMs: 2400,

  maxHops: 12,

  layerChangeEvery: 4,

  zoomMul: 5,
} as const;

export const PROBE = {
  zoomMul: 2.4,

  ringRatio: 0.36,

  maxZoom: 3,

  minZoom: 0.7,

  innerRing: 0.58,
  enterMs: 700,
  exitMs: 500,

  maxRings: 2,

  prevAlpha: 0.34,

  prevScale: 0.42,

  prevDist: 1.2,
} as const;

export const CONSTELLATION = {
  pad: { ratio: 0.07, maxPx: 64 },

  padNarrow: { ratio: 0.11, maxPx: 64 },

  labelEdgePx: 6,

  dim: 0.86,

  instrumentInsetPx: 260,

  alpha: { current: 1, played: 0.5, unplayed: 0.24 },

  labelMinAlpha: 0.8,

  focusZoom: 3,

  labelGapPx: 3,
  enterMs: 800,
  exitMs: 500,
} as const;

export const GHOST = {
  edgeInset: 34,

  topInset: 168,

  cloudMargin: 46,

  viewCloudRatio: 0.52,

  viewShiftRatio: 0.26,

  alpha: 0.4,

  hitRadius: 22,

  enterSlidePx: 52,

  popScale: 0.5,

  bob: { px: 4.2, speed: 2.3 },
  enterMs: 800,
} as const;

export const ME_OFFSCREEN = {
  inset: 30,

  edgeGap: 20,

  arrow: { gap: 5, len: 11, half: 7 },

  awayAlpha: 0.6,

  awayDot: 3.4,
} as const;

export const FOCUS = {
  zoomMul: 3.2,
} as const;

export const OCCLUSION_EASE = 0.14;

export const HUD_OCCLUSION = { top: 58, bottom: 92 } as const;

export const PROBE_LABEL = {
  titlePx: 13,
  boxTop: 13,
  boxH: 19,
  subPx: 12,

  subY: 42,

  centerGap: 6,
  centerTitlePx: 13.5,
  centerBoxH: 19,
  centerSubPx: 11,

  centerSubY: 37,

  centerRingR: 21.4,

  minGapPx: 8,

  zoomGain: 0.3,

  maxScale: 1.5,

  narrowCapRatio: 0.3,

  narrowCenterCapRatio: 0.72,

  narrowEdgePx: 8,

  narrowGapPx: 4,

  narrowShiftRatio: 0.9,

  narrowStarPx: 24,
} as const;

export const HOP_LINK = {
  dy: 56,

  padX: 12,

  h: 20,

  upDy: 26,
} as const;

export const HOLD = {
  ms: 650,

  moveTol: 6,

  r: 27,
} as const;

export const HOVER_CARD = {
  w: 300,

  wNarrow: 208,
  h: 76,

  hNarrow: 60,

  gap: 22,

  margin: 8,

  graceMs: 220,

  fadeMs: 120,
} as const;

export const RIDE_LOCK_TOAST_MS = 3000;

export const FRIEND_SPREAD = {
  durationMs: 600,

  radiusPx: 26,

  gapPx: 10,

  nameCharPx: { wide: 11, narrow: 6.2 },
} as const;

export const FRIEND_MARKER = {
  radiusPx: 14.5,

  leaderRadiusPx: 17.5,

  shipScale: 1.45,

  hitPx: 25,

  namePx: 12,
} as const;

export const MAP_TITLE_PX = { cover: 12, label: 13 } as const;

export const MINIMAP = {
  padPx: 6,
} as const;

export const LAYER_TITLE = {
  showMs: 2200,
} as const;

export const MAP_COVERED = {
  engineStepMs: 66,
} as const;
