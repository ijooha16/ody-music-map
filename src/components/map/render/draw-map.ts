import { DEMO } from "@/constants/demo";
import { CONSTELLATION, COVER_COUNT, DEMO_PIN, FRIEND_MARKER, GHOST, HOLD, HOP_LINK, LAYER_COUNT, LAYER_DEPTH, LAYER_NAMES, MAP_TITLE_PX, ME_FLIGHT, ME_OFFSCREEN, PROBE, PROBE_LABEL, STAR_SIZE, STAR_TWINKLE, STAR_VIEW } from "@/constants";
import { FONTS, LAYER_SKY_ALPHA, LAYER_THEMES, LAYER_TINT_MIX, LAYER_TINTS, MAP_COLORS, NEBULA_WASH, rgba } from "@/constants/design-tokens";
import type { MapEngine } from "../engine/map-engine";
import { cullLabels, type LabelRect } from "../engine/probe-layout";
import { drawFriends, drawQueue, drawShip, drawVisor, meAvatar } from "./draw-friends";

const ME_SHIP_R = FRIEND_MARKER.leaderRadiusPx * FRIEND_MARKER.shipScale;

import { coverFor, dustStars, farFieldTile, fitText, glowSprites, puffFor, roundRect, skyStars, mulberry32, type FarFieldTile, type SkyStar } from "./sprites";
import { starColorIdx, starMag, starRgb } from "./star-look";
import { byCoverPriority, cellOf, gridFor, spreadOrder } from "./cover-spread";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function lumOf(i: number, mag: number) {
  return clamp(0.28 * mag + 0.72 * Math.pow(((i * 7919) % 1000) / 1000, 0.8), 0, 1);
}

function twinkle(id: number, t: number, mag: number) {
  if (mag < STAR_TWINKLE.minMag || id % STAR_TWINKLE.nth !== 0) return 1;
  const [dLo, dHi] = STAR_TWINKLE.depth;
  const [pLo, pHi] = STAR_TWINKLE.period;
  const dep = dLo + ((id % 11) / 10) * (dHi - dLo);
  const period = pLo + ((id % 7) / 6) * (pHi - pLo);
  return 1 - dep * (0.5 + 0.5 * Math.sin(((2 * Math.PI) / period) * t + id * 0.7));
}

const seenAt = new Map<number, { first: number; last: number }>();

let settleAt = Number.NEGATIVE_INFINITY;
export function settleAppear(t: number) {
  settleAt = t;
}
function appear(id: number, t: number) {
  const e = seenAt.get(id);
  if (!e) {
    seenAt.set(id, { first: t, last: t });
    return 0;
  }

  if (t !== settleAt && (t - e.last) * 1000 > STAR_VIEW.reappearGapMs) e.first = t;
  e.last = t;
  return Math.min(1, ((t - e.first) * 1000) / STAR_VIEW.appearMs);
}

function forgetStale(t: number) {
  if (seenAt.size <= STAR_VIEW.memoryCap || t === settleAt) return;
  for (const [id, e] of seenAt) if ((t - e.last) * 1000 > STAR_VIEW.forgetMs) seenAt.delete(id);
}

function touch(id: number, t: number) {
  const e = seenAt.get(id);
  if (e) e.last = t;
  else seenAt.set(id, { first: t, last: t });
}

export function layerTint(layerF: number): [number, number, number] {
  const n = LAYER_TINTS.length;
  const l = Math.min(n - 1, Math.max(0, layerF));
  const a = LAYER_TINTS[Math.floor(l)];
  const b = LAYER_TINTS[Math.min(n - 1, Math.floor(l) + 1)];
  const k = l - Math.floor(l);
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k)) as [number, number, number];
}

function themeOf(e: MapEngine, out = false) {
  const layer = e.anim && !out ? e.anim.layer : e.layer;
  return LAYER_THEMES[Math.min(LAYER_THEMES.length - 1, Math.max(0, layer))];
}

function skyOf(layerF: number): [readonly [number, number, number], readonly [number, number, number]] {
  const n = LAYER_THEMES.length;
  const l = Math.min(n - 1, Math.max(0, layerF));
  const a = LAYER_THEMES[Math.floor(l)].sky;
  const b = LAYER_THEMES[Math.min(n - 1, Math.floor(l) + 1)].sky;
  const k = l - Math.floor(l);
  const mix = (p: readonly [number, number, number], q: readonly [number, number, number]) =>
    [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * k)) as [number, number, number];
  return [mix(a[0], b[0]), mix(a[1], b[1])];
}

function tinted(c: readonly [number, number, number], tint: readonly [number, number, number]): [number, number, number] {
  return [0, 1, 2].map((i) => Math.round(c[i] + (tint[i] - c[i]) * LAYER_TINT_MIX)) as [number, number, number];
}

function depthOf(e: MapEngine) {
  const l = e.anim ? e.layer + (e.anim.layer - e.layer) * e.morphT : e.layer;
  return l / (LAYER_COUNT - 1);
}

function drawBackground(g: CanvasRenderingContext2D, e: MapEngine, depth: number) {
  const W = e.W;
  const H = e.H;
  const t = e.time;
  g.globalCompositeOperation = "source-over";
  g.fillStyle = MAP_COLORS.background;
  g.fillRect(0, 0, W, H);

  {
    const layerF = e.anim ? e.layer + (e.anim.layer - e.layer) * e.morphT : e.layer;
    const [top, bottom] = skyOf(layerF);
    const sg = g.createLinearGradient(0, 0, 0, H);
    sg.addColorStop(0, rgba(top, LAYER_SKY_ALPHA));
    sg.addColorStop(1, rgba(bottom, LAYER_SKY_ALPHA));
    g.fillStyle = sg;
    g.fillRect(0, 0, W, H);
  }
  if (depth > 0) {
    g.fillStyle = `rgba(0,0,0,${(depth * LAYER_DEPTH.maxDarken).toFixed(3)})`;
    g.fillRect(0, 0, W, H);
  }

  const washK = e.anim ? themeOf(e, true).wash + (themeOf(e).wash - themeOf(e, true).wash) * e.morphT : themeOf(e).wash;
  const nebulaK = (1 - depth * LAYER_DEPTH.maxNebulaFade) * washK;
  g.globalCompositeOperation = "lighter";
  const big = Math.max(W, H);

  const tint = layerTint(e.anim ? e.layer + (e.anim.layer - e.layer) * e.morphT : e.layer);
  const ox = Math.sin(t * 0.015) * 44;
  const oy = Math.cos(t * 0.011) * 34;

  for (const w of DEMO ? [] : NEBULA_WASH) {
    const px = w.u * W + ox;
    const py = w.v * H + oy;
    const rr = w.r * big * 0.62;
    const gr = g.createRadialGradient(px, py, 0, px, py, rr);
    const c = tinted(w.c, tint);
    gr.addColorStop(0, rgba(c, 0.16 * nebulaK));
    gr.addColorStop(0.42, rgba(c, 0.06 * nebulaK));
    gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(px, py, rr, 0, Math.PI * 2);
    g.fill();
  }
  const spr = glowSprites();
  const sky = skyStars();

  const dim = 1 - depth * LAYER_DEPTH.maxStarDim;
  const field = (ox: number, oy: number, sizeK: number, aK: number, stars: SkyStar[] = sky, n = stars.length) => {
    for (let k = 0; k < n; k++) {
      const bg = stars[k];
      const px = ((((bg.u - ox) % 1) + 1) % 1) * (W + 64) - 32;
      const py = ((((bg.v - oy) % 1) + 1) % 1) * (H + 64) - 32;
      const d = bg.d0 * sizeK;
      g.globalAlpha = (0.06 + bg.lum * 0.19) * (0.55 + 0.45 * Math.sin(t * (0.35 + (bg.i % 17) / 14) + bg.i)) * aK;
      g.drawImage(spr[bg.spr], px - d / 2, py - d / 2, d, d);
    }
  };

  const tiled = (ox: number, oy: number, aK: number, tile: FarFieldTile) => {
    if (aK <= 0) return;
    g.globalAlpha = aK;
    const sx = -((((ox % 1) + 1) % 1)) * tile.w;
    const sy = -((((oy % 1) + 1) % 1)) * tile.h;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        g.drawImage(tile.canvas, sx + i * tile.w - 32, sy + j * tile.h - 32, tile.w, tile.h);
      }
    }
  };

  field(t * 0.0052, -t * 0.0019, 1, dim);

  const farK = 1;
  {
    const camU = (e.cam.cx * e.cam.s) / (W + 64);
    const camV = -(e.cam.cy * e.cam.s) / (H + 64);
    const par = LAYER_DEPTH.parallax;
    const A = LAYER_DEPTH.farFieldAlpha;

    tiled(camU * par.mid + t * 0.0026 + 0.37, camV * par.mid - t * 0.0009 + 0.61, dim * A * farK, farFieldTile("mid", W, H, 0.92, sky, sky.length));
    tiled(camU * par.far + t * 0.0013 + 0.71, camV * par.far - t * 0.0004 + 0.23, dim * A * 0.82 * farK, farFieldTile("far", W, H, 0.8, sky, Math.round(sky.length * 0.7)));

    field(camU * par.near + 0.14, camV * par.near + 0.42, 1.4, dim * LAYER_DEPTH.dustAlpha * farK, dustStars());
  }
  g.globalAlpha = 1;
}

const puffPlan = new Map<number, { k: number; dx: number; dy: number; sc: number; a: number }[]>();
function puffsOf(id: number) {
  let p = puffPlan.get(id);
  if (p) return p;
  const r = mulberry32(7771 + id * 31);
  p = Array.from({ length: 2 }, () => ({ k: Math.floor(r() * 4), dx: (r() - 0.5) * 0.7, dy: (r() - 0.5) * 0.7, sc: 0.55 + r() * 0.75, a: 0.1 + r() * 0.14 }));
  puffPlan.set(id, p);
  return p;
}

function drawNebula(g: CanvasRenderingContext2D, e: MapEngine, out = false) {
  const P = out ? e.posOut : e.pos;
  const A = out ? e.alphaOut : e.alpha;
  const W = e.W;
  const H = e.H;

  const cloud = themeOf(e, out).cloud;
  if (cloud.count === 0) return;
  const R = clamp(0.75 * e.cam.s, 80, Math.max(W, H) * 0.8) * cloud.scale;
  g.globalCompositeOperation = "lighter";

  const step = Math.max(1, Math.floor(e.N / cloud.count));
  for (let i = 0; i < e.N; i += step) {
    const a0 = e.anim ? A[i] * A[i] * A[i] : A[i];
    if (a0 < 0.05) continue;
    const s = e.songs[i];
    const px = P[i * 2];
    const py = P[i * 2 + 1];
    if (px < -R * 1.7 || px > W + R * 1.7 || py < -R * 1.7 || py > H + R * 1.7) continue;
    for (const q of puffsOf(s.musicId)) {
      const rr = R * q.sc;

      const rx = rr * cloud.stretch;
      const ry = rr / cloud.stretch;
      g.globalAlpha = Math.min(1, q.a * a0 * cloud.alpha);
      g.drawImage(puffFor(q.k, starColorIdx(s)), px + q.dx * R - rx, py + q.dy * R - ry, rx * 2, ry * 2);
    }
  }
  g.globalAlpha = 1;
}

function drawStars(g: CanvasRenderingContext2D, e: MapEngine, out = false) {
  const P = out ? e.posOut : e.pos;
  const A = out ? e.alphaOut : e.alpha;

  const spr = glowSprites(themeOf(e, out).star);
  const W = e.W;
  const H = e.H;
  const t = e.time;

  const fieldK = Math.min(1, depthOf(e) * (LAYER_COUNT - 1));
  const fieldSize = 1 + (LAYER_DEPTH.fieldStarSize - 1) * fieldK;
  const fieldAlpha = 1 + (LAYER_DEPTH.fieldStarAlpha - 1) * fieldK;
  const grow = clamp(0.86 + Math.log(Math.max(1, e.cam.s / 100)) * 0.13, 0.86, 1.5);
  const pset = e.probeIdSet();
  const cset = e.constellationIdSet();
  const swx = Math.sin(t * 0.034) * 30 + Math.sin(t * 0.011 + 1.7) * 15;
  const swy = Math.cos(t * 0.027) * 17 + Math.sin(t * 0.008 + 0.6) * 9;
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < e.N; i++) {
    const a0 = A[i];
    if (a0 < 0.01) continue;
    let px = P[i * 2];
    let py = P[i * 2 + 1];
    const s = e.songs[i];

    if (!(px >= -20 && px <= W + 20 && py >= -20 && py <= H + 20)) {
      if (!out && Number.isFinite(px)) touch(s.musicId, t);
      continue;
    }
    if (pset?.has(s.musicId) || cset?.has(s.musicId)) continue;
    const mag = starMag(s);

    const born = out ? 1 : appear(s.musicId, t);
    const on = e.chosen.has(i);
    let d: number;
    let alpha: number;
    if (e.selectedId === s.musicId) {
      d = 15 + Math.pow(mag, 1.6) * 20;
      alpha = 1;
    } else if (on) {
      d = (STAR_SIZE.min + Math.pow(mag, 1.75) * (STAR_SIZE.max - STAR_SIZE.min)) * grow;
      alpha = (0.42 + lumOf(i, mag) * 0.58) * twinkle(s.musicId, t, mag) * born;
    } else {
      d = (2.2 + Math.pow(mag, 1.6) * 3.6) * grow * fieldSize;
      alpha = (0.04 + lumOf(i, mag) * 0.09) * fieldAlpha * born;
      const drift = 0.34 + e.z[i] * 0.05;
      px += swx * drift;
      py += swy * drift;
    }
    if (!s.playable) alpha *= 0.5;
    alpha *= a0;
    if (e.hoverId === s.musicId) alpha = Math.min(1, alpha + 0.3);
    g.globalAlpha = alpha;
    g.drawImage(spr[starColorIdx(s)], px - d / 2, py - d / 2, d, d);

    if (out && e.anim && e.anim.mode === "dive" && alpha > 0.03) {
      const f2 = e.freeRect();
      const tx = px - f2.cx;
      const ty = py - f2.cy;
      const td = Math.hypot(tx, ty) || 1;
      const len = Math.min(260, td * (0.18 + 0.6 * e.morphT)) * (e.anim.dir > 0 ? 1 : -1);
      const x0 = px - (tx / td) * len;
      const y0 = py - (ty / td) * len;
      const tail = g.createLinearGradient(x0, y0, px, py);
      const rgb = starRgb(s);
      tail.addColorStop(0, rgba(rgb, 0));
      tail.addColorStop(1, rgba(rgb, 0.85));
      g.globalAlpha = Math.min(1, alpha * 0.9);
      g.strokeStyle = tail;
      g.lineWidth = Math.max(0.5, d * 0.07);
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(px, py);
      g.stroke();
    }
    if (on) {
      g.globalAlpha = 0.95 * alpha;
      g.fillStyle = MAP_COLORS.core;
      g.beginPath();
      g.arc(px, py, 0.95 + Math.pow(mag, 1.75) * 2.3, 0, 6.284);
      g.fill();
      if (mag > 0.88) {
        g.strokeStyle = rgba(starRgb(s), 0.22 * alpha);
        g.lineWidth = 1;
        const len = d * 0.7;
        g.beginPath();
        g.moveTo(px - len, py);
        g.lineTo(px + len, py);
        g.moveTo(px, py - len);
        g.lineTo(px, py + len);
        g.stroke();
      }
    }
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
}

let coverIdx: number[] = [];
let coverLayer = -1;

let coverCam = { cx: Number.NaN, cy: Number.NaN, s: Number.NaN };

function drawCovers(g: CanvasRenderingContext2D, e: MapEngine) {
  e.coverHits = [];
  if (e.anim) return;
  const f = e.freeRect();

  const M = 42;

  const KEEP = COVER_COUNT.sizePx;
  const grow = clamp(0.86 + Math.log(Math.max(1, e.cam.s / 100)) * 0.13, 0.85, 1.35);
  if (e.coverAlpha < 0.01) return;

  if (coverLayer !== e.layer) {
    coverIdx = [];
    coverLayer = e.layer;

    coverCam = { cx: Number.NaN, cy: Number.NaN, s: Number.NaN };
  }

  const n = e.cam.s < COVER_COUNT.nearScale ? COVER_COUNT.far : COVER_COUNT.near;
  const gap2 = COVER_COUNT.minGapPx * COVER_COUNT.minGapPx;

  const zooming = e.cam.s !== coverCam.s;
  const panning = !zooming && (e.cam.cx !== coverCam.cx || e.cam.cy !== coverCam.cy);
  coverCam = { cx: e.cam.cx, cy: e.cam.cy, s: e.cam.s };

  const usable = (i: number, forNew = false) => {
    if (!e.subset[i]) return false;
    const m = forNew ? M : -KEEP;
    const px = e.pos[i * 2];
    const py = e.pos[i * 2 + 1];
    return px > f.x0 + m && px < f.x1 - m && py > f.y0 + m && py < f.y1 - m;
  };

  const spaced = (i: number, picked: number[]) =>
    picked.every((j) => (e.pos[i * 2] - e.pos[j * 2]) ** 2 + (e.pos[i * 2 + 1] - e.pos[j * 2 + 1]) ** 2 >= gap2);

  const demo = new Set<number>();
  const picked: number[] = [];
  for (const id of e.demoIds) {
    const i = e.indexOf(id);
    if (i == null || !usable(i)) continue;
    demo.add(i);
    picked.push(i);
  }
  const quota = n + demo.size;

  for (const i of coverIdx) {
    if (picked.length >= quota) break;
    if (demo.has(i)) continue;
    if (usable(i) && spaced(i, picked)) picked.push(i);
  }

  if (picked.length < quota && !panning) {
    const candidates = new Set<number>();
    for (let i = 0; i < e.N; i++) if (e.subset[i] && e.repIds.has(e.songs[i].musicId)) candidates.add(i);

    for (const i of e.chosen) candidates.add(i);

    const at = (i: number) => ({ x: e.pos[i * 2], y: e.pos[i * 2 + 1] });
    const { cols, rows } = gridFor(n, f);
    const taken = new Set(picked.map((i) => cellOf(at(i).x, at(i).y, f, cols, rows)));

    const fill = spreadOrder(
      [...candidates]
        .filter((i) => !picked.includes(i) && !demo.has(i) && usable(i, true))
        .sort(byCoverPriority((i) => Boolean(e.songs[i].albumCoverUrl || e.songs[i].albumMbid), (i) => e.songs[i].weight)),
      at,
      f,
      n,
      taken,
    );

    let room = coverIdx.length === 0 ? n : COVER_COUNT.fillPerFrame;
    for (const i of fill) {
      if (picked.length >= quota || room <= 0) break;
      if (spaced(i, picked)) {
        picked.push(i);
        room--;
      }
    }
  }
  coverIdx = picked;

  g.globalCompositeOperation = "source-over";
  g.globalAlpha = e.coverAlpha;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `500 ${MAP_TITLE_PX.cover}px ${FONTS.body}`;

  const rank = (i: number) => e.depthScale(i) + (demo.has(i) ? 10 : 0);
  const paintOrder = [...picked].sort((a, b) => rank(a) - rank(b));
  for (const i of paintOrder) {
    const it = { px: e.pos[i * 2], py: e.pos[i * 2 + 1], s: e.songs[i] };

    const S = COVER_COUNT.sizePx * grow * e.depthScale(i) * (demo.has(i) ? DEMO_PIN.coverGrow : 1);

    e.coverHits.push({ i, px: it.px, py: it.py, r: S / 2 });
    if (e.hoverId === it.s.musicId || e.selectedId === it.s.musicId) continue;
    const x = it.px - S / 2;
    const y = it.py - S / 2;
    g.save();
    g.beginPath();
    g.roundRect(x, y, S, S, 6);
    g.clip();
    g.drawImage(coverFor(it.s), x, y, S, S);
    g.restore();
    g.beginPath();
    g.roundRect(x, y, S, S, 6);
    g.strokeStyle = "rgba(255,255,255,.24)";
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = "rgba(233,241,255,.58)";
    g.fillText(fitText(g, it.s.title, 104), it.px, it.py + S / 2 + 10);
  }
  g.globalAlpha = 1;
}

function drawConstellation(g: CanvasRenderingContext2D, e: MapEngine, currentMusicId: number | null) {
  const c = e.constellation;
  if (!c) return;
  const k = e.constellationK();
  if (k < 0.01) return;
  const spr = glowSprites();
  const pts: { id: number; x: number; y: number }[] = [];
  for (const id of c.ids) {
    const p = e.constellationPos(id);
    if (p) pts.push({ id, x: p.x, y: p.y });
  }
  if (pts.length < 2) return;

  const cursor = currentMusicId == null ? -1 : c.ids.indexOf(currentMusicId);
  const progressOf = (i: number) => (cursor < 0 || i > cursor ? "unplayed" : i === cursor ? "current" : "played");
  const alphaOf = (i: number) => CONSTELLATION.alpha[progressOf(i)];

  g.globalCompositeOperation = "source-over";
  g.fillStyle = `rgba(4,6,13,${(CONSTELLATION.dim * k).toFixed(3)})`;
  g.fillRect(0, 0, e.W, e.H);

  g.globalCompositeOperation = "lighter";
  g.lineWidth = 2.4;
  g.lineJoin = "round";
  g.lineCap = "round";
  for (let i = 1; i < pts.length; i++) {
    const passed = cursor >= 0 && i <= cursor;
    g.globalAlpha = k * (passed ? 0.85 : 0.28);
    g.strokeStyle = MAP_COLORS.routeStops[passed ? 0 : 1];
    g.beginPath();
    g.moveTo(pts[i - 1].x, pts[i - 1].y);
    g.lineTo(pts[i].x, pts[i].y);
    g.stroke();
  }

  pts.forEach((p, i) => {
    const s = e.songs[e.songs.findIndex((x) => x.musicId === p.id)];
    const a = alphaOf(i);
    const cur = progressOf(i) === "current";
    const d = cur ? 34 : 24;
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = k * a * (s.playable ? 1 : 0.55);
    g.drawImage(spr[starColorIdx(s)], p.x - d / 2, p.y - d / 2, d, d);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = k * a;
    g.beginPath();
    g.arc(p.x, p.y, cur ? 6.5 : 4.6, 0, 6.284);
    g.fillStyle = MAP_COLORS.stationFill;
    g.fill();
    g.lineWidth = cur ? 2.6 : 1.8;
    g.strokeStyle = cur ? MAP_COLORS.stationCurrent : MAP_COLORS.stationStroke;
    g.stroke();
    if (e.hoverId === p.id || e.selectedId === p.id) {
      g.globalAlpha = k;
      g.strokeStyle = rgba(starRgb(s), 0.9);
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(p.x, p.y, 13, 0, 6.284);
      g.stroke();
    }
  });

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 12px ${FONTS.body}`;
  const H = 17;
  const gap = CONSTELLATION.labelGapPx;

  const taken = pts.map((p) => ({ x0: p.x - 9, y0: p.y - 9, x1: p.x + 9, y1: p.y + 9 }));
  const hits = (b: { x0: number; y0: number; x1: number; y1: number }) =>
    taken.some((t) => b.x0 < t.x1 + gap && b.x1 > t.x0 - gap && b.y0 < t.y1 + gap && b.y1 > t.y0 - gap);

  const rank = (i: number) => (i === cursor ? 0 : pts[i].id === e.selectedId ? 1 : pts[i].id === e.hoverId ? 2 : 3);
  const order = pts.map((_, i) => i).sort((a, b) => rank(a) - rank(b) || a - b);

  const fr = e.overlayRect();
  const em = CONSTELLATION.labelEdgePx;
  const narrow = e.isNarrow();
  const inside = <T extends { x0: number; y0: number; x1: number; y1: number }>(q: T): T => {
    if (!narrow) return q;
    const w = q.x1 - q.x0;
    const h = q.y1 - q.y0;
    const x0 = Math.min(Math.max(q.x0, fr.x0 + em), fr.x1 - em - w);
    const y0 = Math.min(Math.max(q.y0, fr.y0 + em), fr.y1 - em - h);
    return { ...q, x0, y0, x1: x0 + w, y1: y0 + h };
  };
  for (const i of order) {
    const p = pts[i];
    const s = e.songs[e.songs.findIndex((x) => x.musicId === p.id)];
    const must = rank(i) < 3;
    const title = fitText(g, s.title, must ? 260 : 120);
    const w = g.measureText(title).width + 12;

    const spots = [
      { x0: p.x - w / 2, y0: p.y + 14 },
      { x0: p.x - w / 2, y0: p.y - 14 - H },
      { x0: p.x + 14, y0: p.y - H / 2 },
      { x0: p.x - 14 - w, y0: p.y - H / 2 },
    ].map((q) => inside({ ...q, x1: q.x0 + w, y1: q.y0 + H }));

    const box = spots.find((q) => !hits(q)) ?? (must ? spots[0] : null);
    if (!box) continue;
    taken.push(box);
    g.globalAlpha = k * Math.max(CONSTELLATION.labelMinAlpha, alphaOf(i));
    g.fillStyle = MAP_COLORS.labelBg;
    roundRect(g, box.x0, box.y0, w, H, 5);
    g.fill();
    g.fillStyle = "#dbe4f2";
    g.fillText(title, box.x0 + w / 2, box.y0 + H / 2);
  }

  if (cursor >= 0) {
    g.globalAlpha = k;
    drawMeMarker(g, pts[cursor].x, pts[cursor].y, e.time);
  }
  g.globalAlpha = 1;
}

function drawProbe(g: CanvasRenderingContext2D, e: MapEngine) {
  const p = e.probe;
  if (!p) return;
  const k = e.probeK();
  if (k < 0.01) return;
  const spr = glowSprites();
  const cur = e.currentRing() ?? p.rings[p.rings.length - 1];
  const center = e.probePos(cur.centerId);
  if (!center) return;
  const tx = center.x;
  const ty = center.y;

  g.globalCompositeOperation = "source-over";
  const f = e.overlayRect();
  const Rv = Math.min(f.x1 - f.x0, f.y1 - f.y0) * 0.5;
  const vg = g.createRadialGradient(tx, ty, Rv * 0.2, tx, ty, Rv * 1.9);
  vg.addColorStop(0, `rgba(4,6,13,${0.55 * k})`);
  vg.addColorStop(0.55, `rgba(4,6,13,${0.78 * k})`);
  vg.addColorStop(1, `rgba(4,6,13,${0.92 * k})`);
  g.fillStyle = vg;
  g.fillRect(0, 0, e.W, e.H);

  type Node = { id: number; x: number; y: number; rank: number; a: number; cur: boolean; sc: number };
  const placed = new Set<number>();
  const nodes: Node[] = [];
  const centers: { id: number; x: number; y: number; a: number; cur: boolean; sc: number }[] = [];
  for (let ri = p.rings.length - 1; ri >= 0; ri--) {
    const r = p.rings[ri];
    const isCur = r === cur;

    const sc = e.ringScale(r);

    const a = k * e.ringK(r) * (isCur ? 1 : PROBE.prevAlpha);
    if (a < 0.01) continue;
    const c = e.probePos(r.centerId);
    if (!c) continue;
    if (!placed.has(r.centerId)) {
      placed.add(r.centerId);
      centers.push({ id: r.centerId, x: c.x, y: c.y, a, cur: isCur, sc });
    }

    if (ri > 0) {
      const prev = e.probePos(p.rings[ri - 1].centerId);
      if (prev) {
        g.save();
        g.globalCompositeOperation = "lighter";
        g.strokeStyle = `rgba(150,180,240,${0.22 * k * e.ringK(p.rings[ri - 1])})`;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(prev.x, prev.y);
        g.lineTo(c.x, c.y);
        g.stroke();
        g.restore();
      }
    }
    g.save();
    g.globalCompositeOperation = "lighter";
    g.setLineDash([3, 5]);
    g.lineDashOffset = -((e.time * 16) % 8);
    g.lineWidth = 1;
    r.ids.forEach((id, rank) => {
      const pp = e.probePos(id);
      if (!pp) return;
      if (!placed.has(id)) {
        placed.add(id);
        nodes.push({ id, x: pp.x, y: pp.y, rank, a, cur: isCur, sc });
      }
      g.strokeStyle = `rgba(150,180,240,${0.3 * a})`;
      g.beginPath();
      g.moveTo(c.x, c.y);
      g.lineTo(pp.x, pp.y);
      g.stroke();
    });
    g.setLineDash([]);
    g.restore();
  }

  g.globalCompositeOperation = "lighter";
  for (const n of nodes) {
    const s = e.songs.find((x) => x.musicId === n.id)!;
    const d = (22 + (1 - n.rank / 10) * 10) * n.sc;
    g.globalAlpha = 0.95 * n.a * (s.playable ? 1 : 0.55);
    g.drawImage(spr[starColorIdx(s)], n.x - d / 2, n.y - d / 2, d, d);
    g.globalAlpha = n.a;
    g.fillStyle = MAP_COLORS.core;
    g.beginPath();
    g.arc(n.x, n.y, 2.4 * n.sc, 0, 6.284);
    g.fill();
    if (e.hoverId === n.id || e.selectedId === n.id) {
      g.strokeStyle = rgba(starRgb(s), 0.9);
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(n.x, n.y, 12, 0, 6.284);
      g.stroke();
    }
  }
  g.globalCompositeOperation = "source-over";
  g.textAlign = "center";
  g.textBaseline = "middle";

  const sc = e.probeLabelScale();

  const cap = e.probeLabelCap();
  const clip = (text: string, max: number) => (Number.isFinite(max) ? fitText(g, text, max * sc) : text);

  const L = PROBE_LABEL;
  type Song = (typeof e.songs)[number];

  const narrow = e.isNarrow();
  const subOf = (rank: number, s: Song) => (narrow ? null : `#${rank + 1} · ${s.artist ?? ""}`);

  const linkY = (id: number, x: number, y: number, sub: string | null, lw: number) => {
    const below = y + (sub || !narrow ? HOP_LINK.dy : L.subY) * sc;
    if (!narrow) return below;
    const hh = (HOP_LINK.h * sc) / 2;
    const hw = lw / 2 + HOP_LINK.padX;
    const fits = (ly: number) => ly - hh >= f.y0 && ly + hh <= f.y1;

    const covers = (ly: number, sx: number, sy: number, r: number) => Math.abs(sx - x) < hw + r && Math.abs(sy - ly) < hh + r;
    const clear = (ly: number) => !covers(ly, tx, ty, L.centerRingR) && !nodes.some((n) => n.cur && n.id !== id && covers(ly, n.x, n.y, 12));
    const above = y - HOP_LINK.upDy * sc;
    for (const ly of [below, above]) if (fits(ly) && clear(ly)) return ly;
    return fits(below) ? below : above;
  };
  const LINK = "주변 보기 ›";
  const drawLabel = (x: number, y: number, s: Song, sub: string | null, a: number, link: boolean) => {
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = a;
    g.font = `500 ${L.titlePx * sc}px ${FONTS.body}`;

    const title = clip(s.title, cap.line);
    const tw = g.measureText(title).width;
    g.fillStyle = MAP_COLORS.labelBg;
    roundRect(g, x - tw / 2 - 6 * sc, y + L.boxTop * sc, tw + 12 * sc, L.boxH * sc, 5 * sc);
    g.fill();
    g.fillStyle = "rgba(233,241,255,.92)";
    g.fillText(title, x, y + (L.boxTop + L.boxH / 2) * sc);
    if (sub) {
      g.font = `500 ${L.subPx * sc}px ${FONTS.mono}`;
      g.fillStyle = "rgba(147,164,196,.7)";
      g.fillText(clip(sub, cap.line), x, y + L.subY * sc);
    }
    if (link) {
      const pulse = 0.72 + 0.28 * Math.sin(e.time * 3);
      g.globalAlpha = a * pulse;
      g.font = `600 ${11.5 * sc}px ${FONTS.body}`;
      g.fillStyle = MAP_COLORS.me;
      const lw = g.measureText(LINK).width;
      const ly = linkY(s.musicId, x, y, sub, lw);
      g.fillText(LINK, x, ly);
      e.hopLink = { id: s.musicId, x: x - lw / 2 - HOP_LINK.padX, y: ly - (HOP_LINK.h * sc) / 2, w: lw + HOP_LINK.padX * 2, h: HOP_LINK.h * sc };
    }
  };
  const sel = e.selectedId;
  const song = e.songs.find((s) => s.musicId === cur.centerId)!;

  const lr = L.centerRingR;

  let hidden = new Set<number>();
  if (narrow) {
    const songOf = (id: number) => e.songs.find((x) => x.musicId === id)!;
    const rectOf = (x: number, y: number, s: Song, sub: string | null, link: boolean, keep = false): LabelRect => {
      g.font = `500 ${L.titlePx * sc}px ${FONTS.body}`;
      let half = g.measureText(clip(s.title, cap.line)).width / 2 + 6 * sc;

      let y0 = y - 10 * sc;
      let y1 = y + (L.boxTop + L.boxH + 2) * sc;
      if (sub) {
        g.font = `500 ${L.subPx * sc}px ${FONTS.mono}`;
        half = Math.max(half, g.measureText(clip(sub, cap.line)).width / 2);
        y1 = y + (L.subY + L.subPx / 2 + 2) * sc;
      }
      if (link) {
        g.font = `600 ${11.5 * sc}px ${FONTS.body}`;
        const lw = g.measureText(LINK).width;
        half = Math.max(half, lw / 2 + HOP_LINK.padX);
        const ly = linkY(s.musicId, x, y, sub, lw);
        y0 = Math.min(y0, ly - (HOP_LINK.h * sc) / 2);
        y1 = Math.max(y1, ly + (HOP_LINK.h * sc) / 2);
      }
      return { id: s.musicId, x0: x - half, x1: x + half, y0, y1, keep };
    };
    g.font = `600 ${L.centerTitlePx * sc}px ${FONTS.body}`;
    const ch = Math.max(g.measureText(clip(song.title, cap.center)).width / 2 + 7 * sc, lr + 4);
    const rects: LabelRect[] = [{ id: song.musicId, x0: tx - ch, x1: tx + ch, y0: ty - lr - 4, y1: ty + lr + (L.centerGap + L.centerBoxH + 4) * sc, keep: true }];
    const selN = nodes.find((n) => n.id === sel && n.cur);
    const selC = selN ? null : centers.find((c) => c.id === sel && !c.cur);
    if (selN) rects.push(rectOf(selN.x, selN.y, songOf(selN.id), null, true, true));
    else if (selC) rects.push(rectOf(selC.x, selC.y, songOf(selC.id), "이전 중심", true, true));
    for (const n of nodes) if (n.cur && n.id !== sel) rects.push(rectOf(n.x, n.y, songOf(n.id), null, false));
    for (const c of centers) if (!c.cur && c.id !== sel) rects.push(rectOf(c.x, c.y, songOf(c.id), "이전 중심", false));
    hidden = cullLabels(rects, 0);
  }

  for (const n of nodes) {
    if (!n.cur || n.id === sel || hidden.has(n.id)) continue;
    const s = e.songs.find((x) => x.musicId === n.id)!;
    drawLabel(n.x, n.y, s, subOf(n.rank, s), n.a, false);
  }
  g.globalAlpha = 1;

  g.globalCompositeOperation = "lighter";
  for (const c of centers) {
    if (c.cur) continue;
    const s = e.songs.find((x) => x.musicId === c.id)!;
    g.globalAlpha = c.a;
    const cd = 32 * c.sc;
    g.drawImage(spr[starColorIdx(s)], c.x - cd / 2, c.y - cd / 2, cd, cd);
    g.fillStyle = MAP_COLORS.core;
    g.beginPath();
    g.arc(c.x, c.y, 2.4, 0, 6.284);
    g.fill();
    if (e.hoverId === c.id || e.selectedId === c.id) {
      g.globalAlpha = Math.min(1, k);
      g.strokeStyle = rgba(starRgb(s), 0.9);
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(c.x, c.y, 12, 0, 6.284);
      g.stroke();
    }

    if (sel !== c.id && !hidden.has(c.id)) drawLabel(c.x, c.y, s, "이전 중심", c.a * 1.6, false);
    g.globalCompositeOperation = "lighter";
  }

  const frgb = starRgb(song);

  const rk = e.ringK(cur);
  const pop = cur.unfold ? 1 + 0.55 * Math.sin(Math.PI * rk) : 1;
  const rr = (19 + Math.sin(e.time * 2.2) * 2.4) * pop;
  const ck = k * rk;
  g.globalAlpha = ck;
  const cd = 44 * pop;
  g.drawImage(spr[starColorIdx(song)], tx - cd / 2, ty - cd / 2, cd, cd);
  g.beginPath();
  g.arc(tx, ty, rr, 0, 6.284);
  g.strokeStyle = rgba(frgb, 0.85);
  g.lineWidth = 1.6;
  g.stroke();
  g.beginPath();
  g.arc(tx, ty, rr * 0.56, 0, 6.284);
  g.strokeStyle = rgba(frgb, 0.34);
  g.lineWidth = 1;
  g.stroke();
  g.globalCompositeOperation = "source-over";
  g.font = `600 ${L.centerTitlePx * sc}px ${FONTS.body}`;

  const centerTitle = clip(song.title, cap.center);
  const tw = g.measureText(centerTitle).width;
  g.fillStyle = MAP_COLORS.labelBg;
  roundRect(g, tx - tw / 2 - 7 * sc, ty + lr + L.centerGap * sc, tw + 14 * sc, L.centerBoxH * sc, 6 * sc);
  g.fill();
  g.fillStyle = "rgba(233,241,255,.98)";
  g.fillText(centerTitle, tx, ty + lr + (L.centerGap + L.centerBoxH / 2) * sc);

  if (!narrow) {
    g.font = `500 ${L.centerSubPx * sc}px ${FONTS.mono}`;
    g.fillStyle = "rgba(147,164,196,.62)";
    g.fillText(clip(`NEARBY · 유사도 상위 ${cur.ids.length}곡 · ${LAYER_NAMES[e.layer]}`, cap.center), tx, ty + lr + L.centerSubY * sc);
  }

  if (sel != null && sel !== cur.centerId) {
    const n = nodes.find((x) => x.id === sel && x.cur);
    const c = n ? null : centers.find((x) => x.id === sel && !x.cur);
    const s = e.songs.find((x) => x.musicId === sel);
    if (n && s) drawLabel(n.x, n.y, s, subOf(n.rank, s), n.a, true);
    else if (c && s) drawLabel(c.x, c.y, s, "이전 중심", Math.min(1, k), true);
  }
  g.globalAlpha = 1;
}

function meRadius(t: number) {
  return 13 + Math.sin(t * 1.6) * 2.6;
}

function meTheme(away: boolean) {
  return away
    ? { core: MAP_COLORS.meAway, ring: MAP_COLORS.meAwayRing, inner: MAP_COLORS.meAwayRingInner }
    : { core: MAP_COLORS.me, ring: MAP_COLORS.meRing, inner: MAP_COLORS.meRingInner };
}

function drawMeMarker(g: CanvasRenderingContext2D, px: number, py: number, t: number, away = false) {
  const rr = meRadius(t);
  const c = meTheme(away);
  g.save();
  g.translate(px, py);
  g.globalCompositeOperation = "lighter";
  g.beginPath();
  g.arc(0, 0, rr, 0, 6.284);
  g.strokeStyle = c.ring;
  g.lineWidth = 1.2;
  g.stroke();
  g.beginPath();
  g.arc(0, 0, rr * 0.62, 0, 6.284);
  g.strokeStyle = c.inner;
  g.stroke();
  g.rotate(Math.PI / 4);
  g.fillStyle = c.core;
  g.fillRect(-4, -4, 8, 8);
  g.restore();
}

function drawMeAway(g: CanvasRenderingContext2D, e: MapEngine, off: { x: number; y: number; dir: { x: number; y: number }; elsewhere: boolean }) {
  const { x, y, dir, elsewhere } = off;
  const c = meTheme(elsewhere);
  const a = ME_OFFSCREEN.arrow;

  const pulse = 0.88 + 0.12 * Math.sin(e.time * 1.6);
  g.save();
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = ME_OFFSCREEN.awayAlpha * pulse;

  g.fillStyle = c.core;
  g.beginPath();
  g.arc(x, y, ME_OFFSCREEN.awayDot, 0, 6.284);
  g.fill();

  const ax = x + dir.x * (ME_OFFSCREEN.awayDot + a.gap);
  const ay = y + dir.y * (ME_OFFSCREEN.awayDot + a.gap);
  g.beginPath();
  g.moveTo(ax + dir.x * a.len, ay + dir.y * a.len);
  g.lineTo(ax - dir.y * a.half, ay + dir.x * a.half);
  g.lineTo(ax + dir.y * a.half, ay - dir.x * a.half);
  g.closePath();
  g.fill();

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 11px ${FONTS.mono}`;
  g.fillStyle = c.core;
  g.fillText("나", x - dir.x * 13, y - dir.y * 13);
  g.restore();
  g.globalAlpha = 1;
}

function drawMe(g: CanvasRenderingContext2D, e: MapEngine) {
  e.myQueueScreen.clear();

  if (e.anim || e.follow || e.myId == null || e.constellationActive()) return;

  const off = e.meArrow();
  if (off) {
    drawMeAway(g, e, off);
    return;
  }

  const { px, py, from, onRing } = e.meScreen();

  if (from) {
    const tx = px - from.px;
    const ty = py - from.py;
    const td = Math.hypot(tx, ty) || 1;
    const len = td * ME_FLIGHT.trail;
    const grad = g.createLinearGradient(px - (tx / td) * len, py - (ty / td) * len, px, py);
    grad.addColorStop(0, "rgba(79,227,206,0)");
    grad.addColorStop(1, "rgba(79,227,206,.75)");
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = grad;
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(px - (tx / td) * len, py - (ty / td) * len);
    g.lineTo(px, py);
    g.stroke();
    g.globalCompositeOperation = "source-over";
  }

  if (e.myRiders > 0) {
    let target: number | null = null;
    if (from) {
      const fl = e.meFlight;
      const to = fl ? e.worldToScreen(fl.bx, fl.by) : null;
      const [dx, dy] = Math.hypot(px - from.px, py - from.py) > 2 || !to ? [px - from.px, py - from.py] : [to.px - from.px, to.py - from.py];
      if (Math.hypot(dx, dy) > 1e-3) target = Math.atan2(dy, dx) + Math.PI / 2;
    }
    const ang = e.shipTurn.step("me", target, e.time * 1000);

    drawQueue(g, px, py, ME_SHIP_R, ang, e.time, { me: null, riders: e.myRiderUsers, count: e.myRiders }, e.myQueueScreen);
    drawShip(g, px, py, ME_SHIP_R, ang, e.time);

    drawVisor(g, px, py, ME_SHIP_R * 0.72, meAvatar(e));
    g.globalCompositeOperation = "source-over";
  } else {
    drawMeMarker(g, px, py, e.time);
    g.globalCompositeOperation = "source-over";
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(79,227,206,.95)";
  g.font = `600 11.5px ${FONTS.mono}`;

  g.fillText("나", px, onRing ? py - 22 : py + 24);
}

function drawGhost(g: CanvasRenderingContext2D, e: MapEngine) {
  const p = e.ghostPos();
  if (!p || !e.ghost) return;
  const i = e.songs.findIndex((x) => x.musicId === e.ghost!.musicId);
  if (i < 0) return;
  const s = e.songs[i];
  const kk = e.ghostK();
  const k = kk * GHOST.alpha;
  const f = e.freeRect();

  let ox = p.x - f.cx;
  let oy = p.y - f.cy;
  const od = Math.hypot(ox, oy) || 1;
  ox /= od;
  oy /= od;

  const labelDir = oy > 0.35 ? -1 : 1;

  const slide = (1 - kk) * GHOST.enterSlidePx;
  const bob = Math.sin(e.time * GHOST.bob.speed) * GHOST.bob.px * kk;
  const pop = 1 + Math.sin(kk * Math.PI) * GHOST.popScale;
  const cx = p.x + ox * (slide + bob);
  const cy = p.y + oy * (slide + bob);
  const rr = (14 + Math.sin(e.time * GHOST.bob.speed) * 2.2) * pop;

  g.globalCompositeOperation = "lighter";
  g.globalAlpha = k;
  const gr = 26 * pop;
  g.drawImage(glowSprites()[starColorIdx(s)], cx - gr, cy - gr, gr * 2, gr * 2);

  if (kk < 1) {
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = (1 - kk) * 0.5;
    g.strokeStyle = rgba(starRgb(s), 0.9);
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, rr + (1 - kk) * 34, 0, 6.284);
    g.stroke();
  }

  g.globalCompositeOperation = "source-over";
  g.globalAlpha = k * 1.6;
  g.setLineDash([4, 5]);
  g.strokeStyle = rgba(starRgb(s), 0.9);
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(cx, cy, rr, 0, 6.284);
  g.stroke();

  g.globalAlpha = k * 0.7;
  g.beginPath();
  g.arc(cx, cy, rr * 0.62, 0, 6.284);
  g.stroke();
  g.setLineDash([]);

  g.globalAlpha = k * 1.9;
  g.fillStyle = rgba(starRgb(s), 0.9);
  const ax = cx + ox * (rr + 6);
  const ay = cy + oy * (rr + 6);
  g.beginPath();
  g.moveTo(ax + ox * 8, ay + oy * 8);
  g.lineTo(ax - oy * 5.5, ay + ox * 5.5);
  g.lineTo(ax + oy * 5.5, ay - ox * 5.5);
  g.closePath();
  g.fill();

  g.globalAlpha = kk;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const label = "이 영역에 없는 곡";
  g.font = `600 11px ${FONTS.mono}`;
  const labelW = g.measureText(label).width;
  g.font = `500 ${MAP_TITLE_PX.label}px ${FONTS.body}`;
  const title = fitText(g, s.title, 150);
  const tw = Math.max(labelW, g.measureText(title).width);
  const ly = labelDir > 0 ? cy + rr + 5 : cy - rr - 41;
  const lx = clamp(cx, f.x0 + tw / 2 + 12, f.x1 - tw / 2 - 12);
  g.fillStyle = MAP_COLORS.labelBg;
  roundRect(g, lx - tw / 2 - 7, ly, tw + 14, 18, 6);
  g.fill();
  g.fillStyle = "rgba(233,241,255,.82)";
  g.fillText(title, lx, ly + 9);
  g.font = `600 11px ${FONTS.mono}`;
  g.fillStyle = "rgba(147,164,196,.8)";
  g.fillText(label, lx, ly + 25);
}

function drawSelected(g: CanvasRenderingContext2D, e: MapEngine) {
  if (e.selectedId == null || e.probe || !e.isAlive(e.selectedId)) return;
  const w = e.worldOf(e.selectedId)!;
  const { px, py } = e.worldToScreen(w.x, w.y, e.cam, e.parOf(e.selectedId));
  const song = e.songs.find((s) => s.musicId === e.selectedId)!;
  const rr = 19 + Math.sin(e.time * 2.2) * 2.4;
  g.globalCompositeOperation = "lighter";
  g.beginPath();
  g.arc(px, py, rr, 0, 6.284);
  g.strokeStyle = rgba(starRgb(song), 0.85);
  g.lineWidth = 1.6;
  g.stroke();
  g.globalCompositeOperation = "source-over";
}

function drawHold(g: CanvasRenderingContext2D, e: MapEngine) {
  const h = e.hold;
  if (!h) return;
  const p = e.screenPosOf(h.id);
  if (!p) return;
  const k = e.holdK();
  if (k < 0.02) return;
  const a0 = -Math.PI / 2;
  g.globalCompositeOperation = "lighter";

  g.beginPath();
  g.arc(p.x, p.y, HOLD.r, 0, 6.284);
  g.strokeStyle = `rgba(79,227,206,${0.18 * Math.min(1, k * 4)})`;
  g.lineWidth = 1;
  g.stroke();

  g.beginPath();
  g.arc(p.x, p.y, HOLD.r, a0, a0 + 6.284 * k);
  g.strokeStyle = `rgba(79,227,206,${0.55 + 0.4 * k})`;
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.stroke();
  g.lineCap = "butt";

  const glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, HOLD.r);
  glow.addColorStop(0, `rgba(79,227,206,${0.22 * k * k})`);
  glow.addColorStop(1, "rgba(79,227,206,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(p.x, p.y, HOLD.r, 0, 6.284);
  g.fill();
  g.globalCompositeOperation = "source-over";
}

function drawPressure(g: CanvasRenderingContext2D, e: MapEngine) {
  if (e.anim || e.pressure < 0.01) return;
  const f = e.freeRect();
  const dir = e.pressureDir;
  const label = dir > 0 ? `↓ ${LAYER_NAMES[Math.min(e.layer + 1, LAYER_NAMES.length - 1)]}으로 파고들기` : `↑ ${LAYER_NAMES[Math.max(e.layer - 1, 0)]}으로 떠오르기`;
  const color = dir > 0 ? "#4fe3ce" : "#ffc46b";
  const y = f.cy - Math.min(e.W, e.H) * 0.26 - 24;
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = Math.min(1, e.pressure * 1.5);
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 14px ${FONTS.body}`;
  g.fillText(label, f.cx, y);
  const bw = 160;
  g.fillStyle = "rgba(255,255,255,.12)";
  g.fillRect(f.cx - bw / 2, y + 14, bw, 3);
  g.fillStyle = color;
  g.fillRect(f.cx - bw / 2, y + 14, bw * e.pressure, 3);
  g.globalAlpha = 1;
}

export function drawMap(g: CanvasRenderingContext2D, e: MapEngine, currentMusicId: number | null) {
  forgetStale(e.time);

  e.hopLink = null;

  drawBackground(g, e, depthOf(e));
  if (e.anim) {
    drawStars(g, e, true);
  }
  drawNebula(g, e);
  drawStars(g, e);
  drawCovers(g, e);

  drawFriends(g, e);
  drawSelected(g, e);
  drawGhost(g, e);

  drawMe(g, e);

  drawConstellation(g, e, currentMusicId);
  drawProbe(g, e);
  drawHold(g, e);
  drawPressure(g, e);
}
