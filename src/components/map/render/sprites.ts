import { DEMO } from "@/constants/demo";
import { NO_GENRE_ID } from "@/constants";
import { GENRE_COLORS, genreRgb, rgba, type StarShape } from "@/constants/design-tokens";
import { starColorIdx } from "./star-look";
import type { MapPoint, NearbyUser } from "@/types";
import { BudgetCache, canvasBytes } from "@/lib/budget-cache";
import { albumCover } from "./cover-art";

export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPR_SIZE = 48;
const glowByShape = new Map<StarShape, HTMLCanvasElement[]>();

export function glowSprites(shape: StarShape = "halo"): HTMLCanvasElement[] {
  const hit = glowByShape.get(shape);
  if (hit) return hit;
  const made = GENRE_COLORS.map((rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = SPR_SIZE;
    const g = c.getContext("2d")!;
    const m = SPR_SIZE / 2;

    const light: [number, number, number] = DEMO ? [255, 255, 255] : [Math.min(255, rgb[0] + 70), Math.min(255, rgb[1] + 70), Math.min(255, rgb[2] + 70)];

    const halo = (core: number, spread: number, peak = 1) => {
      const grd = g.createRadialGradient(m, m, 0, m, m, m);
      grd.addColorStop(0, `rgba(255,255,255,${peak})`);
      grd.addColorStop(0.14 * core * (DEMO ? 1.4 : 1), rgba(light, 0.95 * peak));
      grd.addColorStop(0.33 * spread, rgba(rgb, 0.5 * peak));
      grd.addColorStop(Math.min(0.98, 0.62 * spread), rgba(rgb, 0.12 * peak));
      grd.addColorStop(1, rgba(rgb, 0));
      g.fillStyle = grd;
      g.fillRect(0, 0, SPR_SIZE, SPR_SIZE);
    };
    switch (shape) {
      case "halo":
        halo(1, 1);
        break;
      case "cross": {
        halo(0.8, 0.7);

        g.strokeStyle = rgba(light, 0.55);
        g.lineWidth = 1.6;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(m - m * 0.95, m);
        g.lineTo(m + m * 0.95, m);
        g.moveTo(m, m - m * 0.95);
        g.lineTo(m, m + m * 0.95);
        g.stroke();
        break;
      }
      case "smear":

        g.save();
        g.translate(m, m);
        g.rotate(-0.32);
        g.scale(1.55, 0.6);
        g.translate(-m, -m);
        halo(1, 1);
        g.restore();
        break;
      case "diffuse":

        halo(0.6, 1.45, 0.85);
        break;
      case "point":

        halo(1.2, 0.55);
        break;
      case "disc": {
        halo(0.9, 0.7, 0.7);
        g.beginPath();
        g.arc(m, m, m * 0.42, 0, 6.284);
        g.fillStyle = rgba(rgb, 1);
        g.fill();

        g.save();
        g.beginPath();
        g.arc(m, m, m * 0.42, 0, 6.284);
        g.clip();
        g.beginPath();
        g.arc(m - m * 0.16, m - m * 0.16, m * 0.42, 0, 6.284);
        g.rect(0, 0, SPR_SIZE, SPR_SIZE);
        g.fillStyle = "rgba(0,0,0,.5)";
        g.fill("evenodd");
        g.restore();
        break;
      }
      case "spark": {
        halo(1, 0.5);

        g.fillStyle = rgba(light, 0.85);
        const L = m * 0.98;
        const w = m * 0.13;
        g.beginPath();
        g.moveTo(m - L, m);
        g.lineTo(m, m - w);
        g.lineTo(m + L, m);
        g.lineTo(m, m + w);
        g.closePath();
        g.moveTo(m, m - L);
        g.lineTo(m + w, m);
        g.lineTo(m, m + L);
        g.lineTo(m - w, m);
        g.closePath();
        g.fill();
        break;
      }
    }
    return c;
  });
  glowByShape.set(shape, made);
  return made;
}

const farTiles = new Map<string, HTMLCanvasElement>();

export interface FarFieldTile {
  canvas: HTMLCanvasElement;

  w: number;
  h: number;
}

export function farFieldTile(id: string, W: number, H: number, sizeK: number, stars: SkyStar[], n: number): FarFieldTile {
  const w = W + 64;
  const h = H + 64;
  const key = `${id}:${w}x${h}`;
  const hit = farTiles.get(key);
  if (hit) return { canvas: hit, w, h };
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.globalCompositeOperation = "lighter";
  for (let k = 0; k < n; k++) {
    const bg = stars[k];
    const px = (bg.u % 1) * w - 32;
    const py = (bg.v % 1) * h - 32;
    const d = bg.d0 * sizeK;

    g.globalAlpha = (0.06 + bg.lum * 0.19) * 0.775;
    g.drawImage(glowSprites()[bg.spr], px - d / 2, py - d / 2, d, d);
  }

  if (farTiles.size >= 2) farTiles.clear();
  farTiles.set(key, c);
  return { canvas: c, w, h };
}

export interface SkyStar {
  i: number;
  u: number;
  v: number;
  m: number;
  spr: number;
  lum: number;

  d0: number;
}
let sky: SkyStar[] | null = null;
export function skyStars(): SkyStar[] {
  if (sky) return sky;
  const rnd = mulberry32(20260902);
  sky = Array.from({ length: 1100 }, (_, i) => {
    const m = Math.pow(rnd(), 1.9);
    return {
      i,
      u: rnd(),
      v: rnd(),
      m,
      spr: Math.floor(rnd() * NO_GENRE_ID),
      lum: Math.pow(rnd(), 0.7),
      d0: 1.3 + Math.pow(m, 1.5) * 4.2,
    };
  });
  return sky;
}

let dust: SkyStar[] | null = null;
export function dustStars(): SkyStar[] {
  if (dust) return dust;
  const rnd = mulberry32(20260912);
  dust = Array.from({ length: 2200 }, (_, i) => {
    const m = Math.pow(rnd(), 1.15);
    return {
      i,
      u: rnd(),
      v: rnd(),
      m,
      spr: Math.floor(rnd() * NO_GENRE_ID),
      lum: Math.pow(rnd(), 0.6),
      d0: 1.3 + Math.pow(m, 1.5) * 4.2,
    };
  });
  return dust;
}

const PUFF_N = 208;
let puffBase: HTMLCanvasElement[] | null = null;
const puffTint = new Map<string, HTMLCanvasElement>();

function puffBases(): HTMLCanvasElement[] {
  if (puffBase) return puffBase;
  puffBase = [];
  for (let k = 0; k < 4; k++) {
    const c = document.createElement("canvas");
    c.width = c.height = PUFF_N;
    const g = c.getContext("2d")!;
    const r = mulberry32(9001 + k * 577);
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 38; i++) {
      const a = r() * 6.284;
      const rad = Math.pow(r(), 0.65) * PUFF_N * 0.4;
      const x = PUFF_N / 2 + Math.cos(a) * rad;
      const y = PUFF_N / 2 + Math.sin(a) * rad;
      const rr = PUFF_N * (0.07 + r() * 0.27);
      const al = 0.04 + r() * 0.1;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(255,255,255,${al})`);
      gr.addColorStop(0.55, `rgba(255,255,255,${al * 0.34})`);
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, rr, 0, 6.284);
      g.fill();
    }
    g.globalCompositeOperation = "destination-in";
    const m = g.createRadialGradient(PUFF_N / 2, PUFF_N / 2, 0, PUFF_N / 2, PUFF_N / 2, PUFF_N / 2);
    m.addColorStop(0, "rgba(0,0,0,1)");
    m.addColorStop(0.6, "rgba(0,0,0,.9)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = m;
    g.fillRect(0, 0, PUFF_N, PUFF_N);
    puffBase.push(c);
  }
  return puffBase;
}

export function puffFor(k: number, colorIdx: number): HTMLCanvasElement {
  const key = `${k}:${colorIdx}`;
  let c = puffTint.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = PUFF_N;
  const g = c.getContext("2d")!;
  g.drawImage(puffBases()[k], 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = rgba(GENRE_COLORS[colorIdx], 1);
  g.fillRect(0, 0, PUFF_N, PUFF_N);
  puffTint.set(key, c);
  return c;
}

const avCache = new Map<string, HTMLCanvasElement>();
export function avatarFor(u: NearbyUser): HTMLCanvasElement {
  let c = avCache.get(u.email);
  if (c) return c;
  if (avCache.size > 400) avCache.clear();
  const N = 76;
  c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  const [a1 = 0.5, a2 = 0.5, a3 = 0.5, a4 = 0.5, a5 = 0.5, a6 = 0.5] = u.avatarSeed;
  const A = genreRgb(u.genreId);
  const B = genreRgb(u.genreId + (a1 < 0.5 ? 3 : 7));
  const gr = g.createLinearGradient(0, 0, N, N);
  gr.addColorStop(0, rgba(A, 1));
  gr.addColorStop(1, rgba(B, 1));
  g.fillStyle = gr;
  g.fillRect(0, 0, N, N);
  g.globalAlpha = 0.26;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(N * (0.16 + a5 * 0.24), N * (0.14 + a6 * 0.16), N * 0.26, 0, 6.284);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = "rgba(5,9,18,.38)";
  g.beginPath();
  g.arc(N * 0.5, N * (0.4 + a2 * 0.05), N * 0.165, 0, 6.284);
  g.fill();
  g.beginPath();
  g.ellipse(N * 0.5, N * (1.06 + a3 * 0.05), N * (0.33 + a4 * 0.07), N * 0.31, 0, Math.PI, 0, true);
  g.fill();
  avCache.set(u.email, c);
  return c;
}

export const ME_AVATAR: NearbyUser = {
  email: "me",
  nickname: "나",
  imageUrl: null,
  isOnline: true,
  musicId: 0,
  viewingMusicId: 0,
  genreId: 0,
  meetingCount: 0,
  riderCount: 0,
  followingNickname: null,
  avatarSeed: [0.32, 0.58, 0.21, 0.77, 0.44, 0.68],
};

export const COVER_PX = 104;

const coverCache = new BudgetCache<string, HTMLCanvasElement>(12 * 1024 * 1024, canvasBytes);

export function coverFor(s: MapPoint, size: number = COVER_PX): HTMLCanvasElement {
  const real = albumCover(s.musicId, s.albumMbid, size);
  if (real) return real;
  const key = `${s.musicId}:${size}`;
  let c = coverCache.get(key);
  if (c) return c;
  const N = size;
  c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  const r = mulberry32(((s.musicId + 1) * 2246822519) >>> 0);

  const ci = starColorIdx(s);
  const A = GENRE_COLORS[ci];
  const B = GENRE_COLORS[(ci + (r() < 0.5 ? 2 : 6)) % GENRE_COLORS.length];
  const gr = g.createLinearGradient(0, 0, N * (0.3 + r()), N);
  gr.addColorStop(0, rgba(A, 1));
  gr.addColorStop(1, rgba(B, 1));
  g.fillStyle = "#070b14";
  g.fillRect(0, 0, N, N);
  g.globalAlpha = 0.82;
  g.fillStyle = gr;
  g.fillRect(0, 0, N, N);
  const n = 2 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    g.globalAlpha = 0.2 + r() * 0.45;
    g.fillStyle = i % 2 ? "rgba(5,8,16,.95)" : "rgba(255,255,255,.92)";
    const t = Math.floor(r() * 3);
    if (t === 0) {
      g.beginPath();
      g.arc(r() * N, r() * N, N * (0.13 + r() * 0.3), 0, 6.284);
      g.fill();
    } else if (t === 1) {
      g.fillRect(0, r() * N, N, N * (0.05 + r() * 0.14));
    } else {
      const x = r() * N;
      const y = r() * N;
      const w = N * (0.28 + r() * 0.5);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + w, y + w * 0.35);
      g.lineTo(x + w * 0.25, y + w);
      g.closePath();
      g.fill();
    }
  }
  g.globalAlpha = 1;
  coverCache.set(key, c);
  return c;
}

const trailCache = new Map<string, [number, number][]>();
export function trailOf(email: string): [number, number][] {
  let t = trailCache.get(email);
  if (t) return t;
  let h = 2166136261;
  for (const ch of email) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0;
  const r = mulberry32(h);
  let a = r() * 6.284;
  let x = 0;
  let y = 0;
  t = [[0, 0]];
  for (let k = 0; k < 8; k++) {
    a += (r() - 0.5) * 1.0;
    x -= Math.cos(a) * (0.55 + r() * 0.6);
    y -= Math.sin(a) * (0.55 + r() * 0.6);
    t.push([x, y]);
  }
  trailCache.set(email, t);
  return t;
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function fitText(g: CanvasRenderingContext2D, str: string, maxW: number) {
  if (g.measureText(str).width <= maxW) return str;
  let out = str;
  while (out.length > 2 && g.measureText(out + "…").width > maxW) out = out.slice(0, -1);
  return out + "…";
}
