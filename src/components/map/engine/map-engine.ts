import { CONSTELLATION, DEMO_PIN, DRILL, FOCUS, FOLLOW, FRIEND_MARKER, FRIEND_SPREAD, GHOST, HOLD, HOP_LINK, HUD_OCCLUSION, ME_FLIGHT, ME_OFFSCREEN, LAYER_COUNT, LAYER_NAMES, FRIEND_MOVE_EPS, MAP_FRIENDS_MAX, OCCLUSION_EASE, OVERLAY_ZOOM, PAN_LIMIT, PROBE, PROBE_LABEL, REPRESENTATIVE_GRID_PX, STAR_VIEW, WHEEL_ZOOM } from "@/constants";
import { BREAKPOINTS } from "@/constants/design-tokens";
import type { EngineSnapshot } from "@/stores/use-map-store";
import type { ConstellationPoint, CrowdCell, LayerBox, MapCamera, MapPoint, NearbyUser } from "@/types";
import { ro } from "@/lib/korean";
import { arcBetween, atArc, type Arc } from "./arc";
import { ShipTurn } from "./ship-turn";
import { shouldRestartFollow } from "./follow-restart";
import { reusablePlan, type FriendPlanEntry } from "./friend-plan";
import { approxTextWidth, placeLabels, separateLabels, type LabelBox } from "./probe-layout";
import { nearestLayerWith } from "./reveal-layer";
import { wheelIntent } from "./ride-zoom";
import { acceptsAnchor } from "./stale-anchor";
import { keptFirst, spreadOrder, type Rect } from "../render/cover-spread";
import { starMag } from "../render/star-look";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const springOut = (t: number) => (t >= 1 ? 1 : 1 - Math.exp(-5 * t) * Math.cos(7 * t));

const approxNameWidth = (s: string) => {
  let w = 0;
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) >= 0x1100 ? FRIEND_SPREAD.nameCharPx.wide : FRIEND_SPREAD.nameCharPx.narrow;
  return w;
};
const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameMask = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
let warnedNaN = false;
import { homeRoute, insideBoxes, sharedDepth } from "./my-place";

const HOME_BIG = "내 위치 찾아가는 중";

const sameBoxes = (a: readonly LayerBox[], b: readonly LayerBox[]) =>
  a.length === b.length && a.every((x, i) => x.layer === b[i].layer && x.xMin === b[i].xMin && x.xMax === b[i].xMax && x.yMin === b[i].yMin && x.yMax === b[i].yMax);

const unit = (x: number, y: number) => {
  const d = Math.hypot(x, y);
  return d < 1e-6 ? null : { x: x / d, y: y / d };
};

const growF = (a: Float32Array, n: number, keep: number) => {
  const b = new Float32Array(n);
  if (keep > 0) b.set(a.subarray(0, Math.min(keep, a.length, n)));
  return b;
};
const growU = (a: Uint8Array<ArrayBufferLike>, n: number) => {
  const b = new Uint8Array(n);
  b.set(a.subarray(0, Math.min(a.length, n)));
  return b;
};

export type GoHomeResult = "moved" | "queued" | "overlay" | "follow" | "none" | "unknown";

interface Frame {
  layer: number;
  cam: MapCamera;
  subset: Uint8Array<ArrayBufferLike>;

  entryS: number;
}

interface Morph {
  t0: number;
  layer: number;
  cam: MapCamera;
  subset: Uint8Array<ArrayBufferLike>;
  big: string;

  dir: 1 | -1;

  entryS?: number;

  mode: "dive" | "fade";
}

export interface ProbeRing {
  centerId: number;
  ids: number[];
  t0: number;

  ax: number;
  ay: number;
  fx: number;
  fy: number;

  demotedAt: number | null;

  unfold: boolean;

  leavingAt: number | null;
}

export interface VisibleFriend {
  user: NearbyUser;
  px: number;
  py: number;

  heading: number;

  scale: number;
  isLeader: boolean;

  spread?: boolean;

  stacked: NearbyUser[];
}

export interface VisibleStar {
  i: number;
  px: number;
  py: number;
  r: number;
}

export interface FollowState {
  leader: NearbyUser;

  driven: boolean;

  viewingMusicId: number;

  playingMusicId: number;

  phase: "view" | "play";

  nextAt: number;
  hops: number;

  mv: { ax: number; ay: number; bx: number; by: number; cx: number; cy: number; t0: number; dur: number; toId: number } | null;

  visited: number[];
}

export interface Occlusion {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const OCCLUSION_EDGES = ["top", "right", "bottom", "left"] as const;

const DEFAULT_OCCLUSION: Occlusion = { top: HUD_OCCLUSION.top, right: 76, bottom: HUD_OCCLUSION.bottom, left: 0 };

export class MapEngine {
  songs: MapPoint[] = [];
  private index = new Map<number, number>();
  private byWeight: number[] = [];

  z = new Float32Array(0);

  viewportCount = 0;

  private cloudExtent = 0;
  N = 0;

  W = 1;
  H = 1;

  private occluded: Occlusion = { ...DEFAULT_OCCLUSION };

  private obstacles: { x0: number; y0: number; x1: number; y1: number }[] = [];

  private occludedTarget: Occlusion = { ...DEFAULT_OCCLUSION };

  layer = 0;
  cam: MapCamera = { cx: 0, cy: 0, s: 100 };

  private camTarget: MapCamera | null = null;
  private entryS = 100;

  subset: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private stack: Frame[] = [];

  boxes: readonly LayerBox[] = [];
  pos = new Float32Array(0);
  private from = new Float32Array(0);
  private to = new Float32Array(0);
  alpha = new Float32Array(0);

  posOut = new Float32Array(0);
  alphaOut = new Float32Array(0);

  morphT = 0;
  private aFrom = new Float32Array(0);
  private aTo = new Float32Array(0);
  anim: Morph | null = null;

  prefetch: readonly LayerBox[] | null = null;

  private prefetched: { boxes: readonly LayerBox[]; songs: MapPoint[] } | null = null;

  private pending: { box: LayerBox; inView: number; since: number; s0: number } | null = null;

  pressure = 0;
  pressureDir: 1 | -1 | 0 = 0;

  myId: number | null = null;

  me = { x: 0, y: 0 };
  private travelToId: number | null = null;

  meFlight: { ax: number; ay: number; bx: number; by: number; cx: number; cy: number; t0: number } | null = null;

  readonly shipTurn = new ShipTurn();

  meHop: { x: number; y: number; t0: number } | null = null;

  hopLink: { id: number; x: number; y: number; w: number; h: number } | null = null;

  hold: { id: number; t0: number } | null = null;

  playingId: number | null = null;

  home: { musicId: number; boxes: readonly LayerBox[] } | null = null;

  private centerAfterMorph: number | null = null;

  private centerLock = false;

  private centerHoldId: number | null = null;

  private pendingHome = false;

  private homeRoute: { musicId: number; dives: LayerBox[] } | null = null;

  private homeTraveling = false;

  isHomeTraveling() {
    return this.homeTraveling;
  }

  selectedId: number | null = null;
  hoverId: number | null = null;
  nearby: { centerId: number; ids: number[] } | null = null;

  probe: {
    rings: ProbeRing[];
    exitingAt: number | null;
    back: MapCamera;
    offFrom: { x: number; y: number };
    offTo: { x: number; y: number };
    offT0: number;
    pan: { x: number; y: number };

    zoom: number;
  } | null = null;

  route: number[] = [];

  overlay = { zoom: 1, dx: 0, dy: 0 };

  private overlayFocusId: number | null = null;
  private overlayFocusZoom = 1;

  private bbox = { x0: -1, x1: 1, y0: -1, y1: 1 };

  constellation: { ids: number[]; layout: ConstellationPoint[]; box: { x0: number; x1: number; y0: number; y1: number }; t0: number; exitingAt: number | null } | null = null;

  ghost: { musicId: number; t0: number } | null = null;

  friends: NearbyUser[] = [];
  private friendsLayer = -1;

  crowd: CrowdCell[] = [];
  crowdLayer = -1;

  private friendPos = new Map<string, { x: number; y: number; heading: number; mv?: Arc }>();

  private friendPlan: FriendPlanEntry[] | null = null;

  private friendPlanScale = Number.NaN;
  private anchorCache = new Map<string, number>();
  private aliveIdx: number[] = [];
  visFriends: VisibleFriend[] = [];

  private expandedStack: { email: string; since: number } | null = null;

  repIds = new Set<number>();

  demoIds = new Set<number>();

  private demoMinLayer = new Map<number, number>();

  private demoVisible(i: number, layer: number, boxes: readonly LayerBox[] = this.boxes) {
    if ((this.demoMinLayer.get(this.songs[i].musicId) ?? 0) > layer) return false;
    return insideBoxes(this.songs[i].pc, boxes, layer);
  }
  private repLayer = -1;

  coverAlpha = 0;
  friendAlpha = 0;

  myRiders = 0;

  myRiderUsers: NearbyUser[] = [];

  myProfile: { nickname: string | null; imageUrl: string | null } | null = null;
  follow: FollowState | null = null;

  private followLayer = -1;
  onFollowEnd: ((reason: string) => void) | null = null;
  onArrive: ((musicId: number) => void) | null = null;

  onLeaderViewingChange: ((musicId: number) => void) | null = null;

  visible: VisibleStar[] = [];

  coverHits: VisibleStar[] = [];
  chosen = new Set<number>();
  time = 0;
  private lastSnap: Partial<EngineSnapshot> = {};
  private snapListener: ((s: Partial<EngineSnapshot>) => void) | null = null;
  private inited = false;

  private touched = false;

  setSnapshotListener(fn: (s: Partial<EngineSnapshot>) => void) {
    this.snapListener = fn;
  }

  setSize(W: number, H: number) {
    if (W === this.W && H === this.H) return;

    const wasUnsized = this.W < 50 || this.H < 50;
    this.W = Math.max(1, W);
    this.H = Math.max(1, H);
    if (!this.inited || this.anim) return;
    if ((wasUnsized || !this.touched) && this.myId != null) {
      const anchor = this.fitAnchor(this.subset, this.layer);
      this.cam = this.fitCam(this.layer, this.subset, anchor);
      this.entryS = this.cam.s;

      if (this.layer === 0) this.cam = this.startCam0(this.subset, anchor);
    }
    this.project();
  }

  setOcclusion(next: Partial<Occlusion>, mode: "ease" | "now" = "ease") {
    this.occludedTarget = { ...this.occludedTarget, ...next };
    if (mode === "now" || !this.inited) this.occluded = { ...this.occludedTarget };
  }

  private allocate(songs: MapPoint[], keep: number) {
    this.songs = songs;
    this.pcStatsCache = null;
    this.N = songs.length;
    this.index = new Map(songs.map((s, i) => [s.musicId, i]));
    this.byWeight = songs.map((_, i) => i).sort((a, b) => songs[b].weight - songs[a].weight);

    this.z = growF(this.z, this.N, keep);
    for (let i = keep; i < this.N; i++) this.z[i] = this.demoIds.has(songs[i].musicId) ? DEMO_PIN.z : (starMag(songs[i]) - 0.5) * 2;
    this.pos = growF(this.pos, this.N * 2, keep * 2);
    this.from = growF(this.from, this.N * 2, keep * 2);
    this.to = growF(this.to, this.N * 2, keep * 2);
    this.posOut = growF(this.posOut, this.N * 2, keep * 2);
    this.alphaOut = growF(this.alphaOut, this.N, keep);
    this.alpha = growF(this.alpha, this.N, keep);
    this.aFrom = growF(this.aFrom, this.N, keep);
    this.aTo = growF(this.aTo, this.N, keep);

    this.subset = growU(this.subset, this.N);
    for (const f of this.stack) f.subset = growU(f.subset, this.N);
    if (this.anim) this.anim.subset = growU(this.anim.subset, this.N);
  }

  setSongs(songs: MapPoint[]) {
    const ids = new Set(songs.map((s) => s.musicId));
    const carry = this.inited ? [] : this.songs.filter((s) => !ids.has(s.musicId));
    this.allocate(carry.length ? [...songs, ...carry] : songs, 0);
    this.subset = this.residentMask();
    this.alpha.set(this.subset);
    this.stack = [];
    this.boxes = [];
    this.layer = 0;

    if (this.myId != null && !this.index.has(this.myId)) this.myId = null;
    const anchor = this.fitAnchor(this.subset, 0);
    if (this.myId != null) {
      const m = this.songs[this.index.get(this.myId)!];
      this.me = { x: m.pc[0], y: m.pc[1] };
    }

    this.entryS = this.fitCam(0, this.subset, anchor).s;
    this.cam = this.startCam0(this.subset, anchor);
    this.inited = true;
    this.rebuildAliveIdx();
    this.project();
  }

  setLayerSongs(layer: number, songs: MapPoint[]) {
    if (!this.inited) {
      this.setSongs(songs);
      return;
    }

    if (layer !== (this.anim?.layer ?? this.layer)) return;
    const ns = this.maskFor(layer, songs);

    if (sameMask(this.anim?.subset ?? this.subset, ns)) return;

    if (this.anim) {
      this.retarget(this.fitCam(layer, ns, this.fitAnchor(ns, layer)), ns);
      return;
    }

    this.morph(
      layer,
      { ...this.cam },
      ns,
      `${LAYER_NAMES[layer]} — 상주 ${songs.length.toLocaleString()}곡`,
      1,
      this.entryS,
      "fade",
    );
  }

  private fitAnchor(mask: Uint8Array, layer: number) {
    const id = this.myId ?? this.centerMost();
    const i = this.index.get(id);
    if (i == null) return this.centerMost();
    return mask[i] ? id : this.nearestIn(mask, id, layer);
  }

  private nearestIn(mask: Uint8Array, fromId: number, layer: number) {
    const c = this.songs[this.index.get(fromId)!];
    const dx = layer * 2;
    const dy = dx + 1;
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < this.N; i++) {
      if (!mask[i]) continue;
      const d = (this.songs[i].pc[dx] - c.pc[dx]) ** 2 + (this.songs[i].pc[dy] - c.pc[dy]) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best >= 0 ? this.songs[best].musicId : fromId;
  }

  get ready() {
    return this.inited;
  }

  setInitialMy(id: number | null) {
    this.myId = id;
  }

  restoreHome(home: { musicId: number; boxes: readonly LayerBox[] } | null) {
    if (home && this.home == null) this.home = home;
  }

  setHover(id: number | null) {
    this.hoverId = id;
  }

  hoverAnchor(): { px: number; py: number } | null {
    if (this.hoverId == null) return null;

    const has = (x: VisibleStar) => this.songs[x.i].musicId === this.hoverId;
    const v = this.visible.find(has) ?? this.coverHits.find(has);
    return v ? { px: v.px, py: v.py } : null;
  }

  setSelected(id: number | null) {
    if (this.ghost && id !== this.ghost.musicId) this.ghost = null;
    this.selectedId = id;
  }

  setCallbacks(cb: {
    onFollowEnd?: (reason: string) => void;
    onArrive?: (musicId: number) => void;
    onLeaderViewingChange?: (musicId: number) => void;
  }) {
    this.onFollowEnd = cb.onFollowEnd ?? null;
    this.onArrive = cb.onArrive ?? null;
    this.onLeaderViewingChange = cb.onLeaderViewingChange ?? null;
  }

  setMyRiders(n: number, users: NearbyUser[] = []) {
    this.myRiders = Math.max(0, n);
    this.myRiderUsers = users;
  }

  setMyProfile(profile: { nickname: string | null; imageUrl: string | null } | null) {
    this.myProfile = profile;
  }

  setFriends(layer: number, friends: NearbyUser[]) {
    if (layer !== this.friendsLayer) this.friendPos.clear();
    else {
      const here = new Set(friends.map((f) => f.email));

      const leader = this.follow?.leader.email;
      for (const email of this.friendPos.keys()) if (!here.has(email) && email !== leader) this.friendPos.delete(email);
    }
    this.friends = friends;
    this.friendsLayer = layer;
    this.anchorCache.clear();
  }

  setCrowd(layer: number, cells: CrowdCell[]) {
    this.crowd = cells;
    this.crowdLayer = layer;
  }

  pointOf(musicId: number): MapPoint | null {
    const i = this.index.get(musicId);
    return i == null ? null : this.songs[i];
  }

  indexOf(musicId: number): number | undefined {
    return this.index.get(musicId);
  }

  setRepresentatives(layer: number, ids: number[]) {
    this.repIds = new Set(ids);
    this.repLayer = layer;
  }

  private anchorFor(u: NearbyUser): { x: number; y: number } | null {
    if (this.isAlive(u.musicId)) return this.worldOf(u.musicId);
    return u.x != null && u.y != null ? { x: u.x, y: u.y } : null;
  }

  private rebuildAliveIdx() {
    this.aliveIdx = [];
    for (let i = 0; i < this.N; i++) if (this.subset[i]) this.aliveIdx.push(i);
    this.anchorCache.clear();
    this.computeBbox();
  }

  private computeBbox() {
    const dx = this.dx();
    const dy = this.dy();
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i]) continue;
      const x = this.songs[i].pc[dx];
      const y = this.songs[i].pc[dy];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    this.bbox = Number.isFinite(x0) ? { x0, x1, y0, y1 } : { x0: -1, x1: 1, y0: -1, y1: 1 };
  }

  worldBox(): Readonly<{ x0: number; x1: number; y0: number; y1: number }> {
    return this.bbox;
  }

  private clampCam() {
    const f = this.freeRect();
    const mx = (((f.x1 - f.x0) / 2) * PAN_LIMIT.slack) / this.cam.s;
    const my = (((f.y1 - f.y0) / 2) * PAN_LIMIT.slack) / this.cam.s;
    this.cam.cx = Math.min(Math.max(this.cam.cx, this.bbox.x0 - mx), this.bbox.x1 + mx);
    this.cam.cy = Math.min(Math.max(this.cam.cy, this.bbox.y0 - my), this.bbox.y1 + my);
  }

  overlayReset() {
    this.overlay = { zoom: 1, dx: 0, dy: 0 };
    this.overlayFocusId = null;
  }

  overlayPan(dx: number, dy: number) {
    this.overlayFocusId = null;
    this.overlay.dx += dx;
    this.overlay.dy += dy;
    this.clampOverlay();
  }

  overlayFocus(id: number) {
    const c = this.constellation;
    if (!c || c.exitingAt || !c.layout.some((q) => q.musicId === id)) return;
    this.overlayFocusId = id;

    this.overlayFocusZoom = Math.min(OVERLAY_ZOOM.max, Math.max(this.overlay.zoom, CONSTELLATION.focusZoom));
  }

  private overlayDest(id: number, zoom: number) {
    const p = this.constellation?.layout.find((q) => q.musicId === id);
    if (!p) return null;
    const fit = this.constellationFit();

    return { dx: -(p.x - fit.bx) * fit.s * zoom, dy: (p.y - fit.by) * fit.s * zoom };
  }

  overlayWheel(deltaY: number) {
    this.overlayFocusId = null;
    const o = this.overlay;
    const next = Math.min(OVERLAY_ZOOM.max, Math.max(OVERLAY_ZOOM.min, o.zoom * Math.exp(-deltaY * WHEEL_ZOOM)));

    const k = next / o.zoom;
    o.zoom = next;
    o.dx *= k;
    o.dy *= k;
    this.clampOverlay();
  }

  private clampOverlay() {
    const f = this.constellationRect();
    const b = this.constellation?.box;
    const fit = this.constellationFit();
    const o = this.overlay;

    const ex = b ? ((b.x1 - b.x0) / 2) * fit.s * o.zoom : 0;
    const ey = b ? ((b.y1 - b.y0) / 2) * fit.s * o.zoom : 0;
    const lx = ex + ((f.x1 - f.x0) / 2) * PAN_LIMIT.slack;
    const ly = ey + ((f.y1 - f.y0) / 2) * PAN_LIMIT.slack;
    o.dx = Math.min(Math.max(o.dx, -lx), lx);
    o.dy = Math.min(Math.max(o.dy, -ly), ly);
  }

  enterProbe(center: MapPoint, neighbors: MapPoint[]) {
    this.adopt([center, ...neighbors]);
    const centerId = center.musicId;
    const ids = neighbors.map((n) => n.musicId);
    const now = performance.now();
    const p = this.probe;
    if (p && !p.exitingAt) {
      const cur = this.currentRing();
      if (cur && cur.centerId === centerId) {
        cur.ids = ids;
        this.nearby = { centerId, ids };
        return;
      }

      const at = this.overlayPosOf(centerId) ?? (cur ? { x: cur.ax, y: cur.ay } : { x: 0, y: 0 });
      if (cur) {
        const dx = cur.ax - at.x;
        const dy = cur.ay - at.y;
        const d = Math.hypot(dx, dy);
        const u = d > 1e-6 ? { x: dx / d, y: dy / d } : { x: 0, y: -1 };
        const R = this.ringR();

        const f = this.overlayRect();
        let vx = u.x * R * PROBE.prevDist;
        let vy = u.y * R * PROBE.prevDist;
        const bx = Math.max(1, (f.x1 - f.x0) / 2 - R * PROBE.prevScale - 24);
        const by = Math.max(1, (f.y1 - f.y0) / 2 - R * PROBE.prevScale - 24);
        const fit = Math.min(1, bx / Math.max(1e-6, Math.abs(vx)), by / Math.max(1e-6, Math.abs(vy)));
        vx *= fit;
        vy *= fit;
        cur.fx = cur.ax;
        cur.fy = cur.ay;
        cur.ax = at.x + vx;
        cur.ay = at.y + vy;
        cur.demotedAt = now;
      }
      p.rings.push({ centerId, ids, t0: now, ax: at.x, ay: at.y, fx: at.x, fy: at.y, demotedAt: null, unfold: true, leavingAt: null });
      const alive = p.rings.filter((r) => !r.leavingAt);
      for (const r of alive.slice(0, Math.max(0, alive.length - PROBE.maxRings))) r.leavingAt = now;

      p.offFrom = this.probeOffset(now);
      p.pan = { x: 0, y: 0 };
      p.offTo = { x: -at.x, y: -at.y };
      p.offT0 = now;
      this.nearby = { centerId, ids };
      this.selectedId = centerId;
      return;
    }
    const back = p?.back ?? { ...this.cam };
    this.probe = {
      rings: [{ centerId, ids, t0: now, ax: 0, ay: 0, fx: 0, fy: 0, demotedAt: null, unfold: false, leavingAt: null }],
      exitingAt: null,
      back,
      offFrom: { x: 0, y: 0 },
      offTo: { x: 0, y: 0 },
      offT0: now,
      pan: { x: 0, y: 0 },
      zoom: 1,
    };
    this.nearby = { centerId, ids };
    this.selectedId = centerId;
    this.focus(centerId, PROBE.zoomMul);
  }

  adopt(points: MapPoint[]) {
    const add = points.filter((p) => !this.index.has(p.musicId));
    if (!add.length) return;

    const keep = this.N;
    this.allocate([...this.songs, ...add], keep);

    let resident = false;
    for (let i = keep; i < this.N; i++) {
      if (this.demoIds.has(this.songs[i].musicId) ? !this.demoVisible(i, this.layer) : this.layer !== 0) continue;
      this.subset[i] = 1;
      this.alpha[i] = 1;
      resident = true;
    }
    if (resident) this.rebuildAliveIdx();
    this.project();
  }

  exitProbe() {
    if (!this.probe || this.probe.exitingAt) return;
    this.probe.exitingAt = performance.now();
    this.nearby = null;

    this.centerHoldId = null;
    if (!this.follow) this.camTarget = { ...this.probe.back };
  }

  currentRing(): ProbeRing | null {
    const p = this.probe;
    if (!p) return null;
    for (let i = p.rings.length - 1; i >= 0; i--) if (!p.rings[i].leavingAt) return p.rings[i];
    return null;
  }

  probeZoom(factor: number): number {
    const p = this.probe;
    if (!p || p.exitingAt) return 1;
    p.zoom = Math.min(PROBE.maxZoom, Math.max(PROBE.minZoom, p.zoom * factor));
    return p.zoom;
  }

  private probeZoomFrame(): { cx: number; cy: number; z: number } | null {
    const p = this.probe;
    if (!p || p.exitingAt || p.zoom <= 1) return null;
    const cur = this.currentRing();
    const c = cur ? this.probeBasePos(cur.centerId) : null;
    const f = this.overlayRect();
    return { cx: c?.x ?? f.cx, cy: c?.y ?? f.cy, z: p.zoom };
  }

  probePan(dx: number, dy: number) {
    const p = this.probe;
    if (!p || p.exitingAt) return;
    const f = this.overlayRect();
    const lim = Math.min(f.x1 - f.x0, f.y1 - f.y0) * PROBE.ringRatio;

    const z = Math.max(1, p.zoom);
    p.pan.x = Math.min(lim, Math.max(-lim, p.pan.x + dx / z));
    p.pan.y = Math.min(lim, Math.max(-lim, p.pan.y + dy / z));
  }

  private probeOffset(now = performance.now()) {
    const p = this.probe!;
    const k = easeInOut(Math.min(1, (now - p.offT0) / PROBE.enterMs));

    return { x: lerp(p.offFrom.x, p.offTo.x, k) + p.pan.x, y: lerp(p.offFrom.y, p.offTo.y, k) + p.pan.y };
  }

  private ringR() {
    const f = this.overlayRect();
    return Math.min(f.x1 - f.x0, f.y1 - f.y0) * PROBE.ringRatio;
  }

  private demoteK(r: ProbeRing, now = performance.now()) {
    return r.demotedAt ? easeInOut(Math.min(1, (now - r.demotedAt) / PROBE.enterMs)) : 0;
  }

  ringScale(r: ProbeRing, now = performance.now()) {
    return lerp(1, PROBE.prevScale, this.demoteK(r, now));
  }

  private ringAnchor(r: ProbeRing, now = performance.now()) {
    const k = this.demoteK(r, now);
    return { x: lerp(r.fx, r.ax, k), y: lerp(r.fy, r.ay, k) };
  }

  private ringSlot(r: ProbeRing, id: number) {
    const rank = r.ids.indexOf(id);
    if (rank < 0) return null;

    if (!r.demotedAt) {
      const laid = this.laidOutRing(r).get(id);
      if (laid) return laid;
    }
    return this.polarSlot(r, rank, this.ringR() * this.ringScale(r));
  }

  private polarSlot(r: ProbeRing, rank: number, R: number) {
    const id = r.ids[rank];
    const n = Math.max(1, r.ids.length);
    const ring = rank % 2 === 0 ? PROBE.innerRing : 1;
    const jitter = (((id * 2654435761) >>> 0) % 1000) / 1000 - 0.5;
    const ang = -Math.PI / 2 + (rank / n) * Math.PI * 2 + jitter * 0.25;
    return { x: Math.cos(ang) * R * ring, y: Math.sin(ang) * R * ring };
  }

  private ringLayout: { key: string; pos: Map<number, { x: number; y: number }> } | null = null;

  private laidOutRing(r: ProbeRing): Map<number, { x: number; y: number }> {
    const R = this.ringR();
    const narrow = this.isNarrow();
    const f = this.overlayRect();

    const box = narrow ? `|${Math.round(f.x0)},${Math.round(f.y0)},${Math.round(f.x1)},${Math.round(f.y1)}` : "";
    const key = `${r.centerId}|${r.ids.join(",")}|${Math.round(R)}|${this.layer}${box}`;
    if (this.ringLayout?.key === key) return this.ringLayout.pos;
    if (narrow) {
      const pos = this.narrowRingLayout(r, R, f);
      this.ringLayout = { key, pos };
      return pos;
    }
    const L = PROBE_LABEL;
    const titleOf = (id: number) => this.pointOf(id)?.title ?? "";
    const artistOf = (id: number) => this.pointOf(id)?.artist ?? "";
    const boxes: LabelBox[] = r.ids.map((id, rank) => {
      const at = this.polarSlot(r, rank, R);
      const w = Math.max(approxTextWidth(titleOf(id), L.titlePx) + 12, approxTextWidth(`#${rank + 1} · ${artistOf(id)}`, L.subPx, true));
      return { id, x: at.x, y: at.y, w, top: -10, bottom: HOP_LINK.dy + HOP_LINK.h / 2 };
    });

    const cw = Math.max(approxTextWidth(titleOf(r.centerId), L.centerTitlePx) + 14, approxTextWidth(`NEARBY · 유사도 상위 ${r.ids.length}곡 · ${LAYER_NAMES[this.layer]}`, L.centerSubPx, true));
    boxes.push({ id: r.centerId, x: 0, y: 0, w: cw, top: -L.centerRingR - 4, bottom: L.centerRingR + L.centerSubY + 8, fixed: true });
    const pos = separateLabels(boxes, L.minGapPx);
    pos.delete(r.centerId);
    this.ringLayout = { key, pos };
    return pos;
  }

  private narrowRingLayout(r: ProbeRing, R: number, f: ReturnType<MapEngine["freeRect"]>): Map<number, { x: number; y: number }> {
    const L = PROBE_LABEL;
    const cap = this.probeLabelCap();
    const titleW = (id: number, px: number, max: number) => Math.min(approxTextWidth(this.pointOf(id)?.title ?? "", px), max);
    const m = L.narrowEdgePx;
    const bounds = { x0: f.x0 + m - f.cx, x1: f.x1 - m - f.cx, y0: f.y0 + m - f.cy, y1: f.y1 - m - f.cy };
    const boxes: LabelBox[] = [
      {
        id: r.centerId,
        x: 0,
        y: 0,
        w: titleW(r.centerId, L.centerTitlePx, cap.center) + 14,
        top: -L.centerRingR - 4,
        bottom: L.centerRingR + L.centerGap + L.centerBoxH + 4,
        fixed: true,
      },
      ...r.ids.map((id, rank) => ({ id, ...this.polarSlot(r, rank, R), w: titleW(id, L.titlePx, cap.line) + 12, top: -10, bottom: L.boxTop + L.boxH + 2 })),
    ];
    const star = { w: L.narrowStarPx, top: -L.narrowStarPx / 2, bottom: L.narrowStarPx / 2 };
    const pos = placeLabels(boxes, L.narrowGapPx, bounds, R * L.narrowShiftRatio, star);
    pos.delete(r.centerId);
    return pos;
  }

  private overlaySlot(id: number): { x: number; y: number; ring: ProbeRing } | null {
    const p = this.probe;
    if (!p) return null;
    for (let i = p.rings.length - 1; i >= 0; i--) {
      const r = p.rings[i];
      if (r.centerId === id) return { ...this.ringAnchor(r), ring: r };
    }
    for (let i = p.rings.length - 1; i >= 0; i--) {
      const r = p.rings[i];
      const sl = this.ringSlot(r, id);
      if (sl) {
        const a = this.ringAnchor(r);
        return { x: a.x + sl.x, y: a.y + sl.y, ring: r };
      }
    }
    return null;
  }

  private overlayPosOf(id: number) {
    const sl = this.overlaySlot(id);
    return sl ? { x: sl.x, y: sl.y } : null;
  }

  probeK(now = performance.now()) {
    const p = this.probe;
    if (!p) return 0;
    if (p.exitingAt) return 1 - easeInOut(Math.min(1, (now - p.exitingAt) / PROBE.exitMs));
    return easeInOut(Math.min(1, (now - p.rings[0].t0) / PROBE.enterMs));
  }

  ringK(r: ProbeRing, now = performance.now()) {
    if (r.leavingAt) return 1 - easeInOut(Math.min(1, (now - r.leavingAt) / PROBE.exitMs));
    return easeInOut(Math.min(1, (now - r.t0) / PROBE.enterMs));
  }

  isNarrow(): boolean {
    return this.W < BREAKPOINTS.tablet;
  }

  probeLabelCap(): { line: number; center: number } {
    if (!this.isNarrow()) return { line: Infinity, center: Infinity };
    const f = this.overlayRect();
    const w = f.x1 - f.x0;
    return { line: w * PROBE_LABEL.narrowCapRatio, center: w * PROBE_LABEL.narrowCenterCapRatio };
  }

  probeLabelScale(): number {
    const z = this.probeZoomFrame()?.z ?? 1;
    return Math.min(PROBE_LABEL.maxScale, 1 + (z - 1) * PROBE_LABEL.zoomGain);
  }

  probePos(id: number): { x: number; y: number } | null {
    const b = this.probeBasePos(id);
    const z = this.probeZoomFrame();
    if (!b || !z || !this.overlaySlot(id)) return b;
    return { x: z.cx + (b.x - z.cx) * z.z, y: z.cy + (b.y - z.cy) * z.z };
  }

  private probeBasePos(id: number): { x: number; y: number } | null {
    const p = this.probe;
    if (!p) return null;
    const i = this.index.get(id);
    if (i == null) return null;
    const real = { x: this.pos[i * 2], y: this.pos[i * 2 + 1] };
    const sl = this.overlaySlot(id);
    if (!sl) return real;

    const f = this.overlayRect();
    const off = this.probeOffset();

    const target = { x: f.cx + off.x + sl.x, y: f.cy + off.y + sl.y };

    if (p.exitingAt) {
      const k = this.probeK();
      return { x: lerp(real.x, target.x, k), y: lerp(real.y, target.y, k) };
    }
    if (sl.ring.leavingAt) return target;

    const k = this.ringK(sl.ring);
    if (sl.ring.unfold && sl.ring.centerId !== id) {
      const a = this.ringAnchor(sl.ring);
      return { x: lerp(f.cx + off.x + a.x, target.x, k), y: lerp(f.cy + off.y + a.y, target.y, k) };
    }
    return { x: lerp(real.x, target.x, k), y: lerp(real.y, target.y, k) };
  }

  probeIdSet(clickable = false): Set<number> | null {
    if (!this.probe) return null;
    const cur = this.currentRing();
    const out = new Set<number>();
    for (const r of this.probe.rings) {
      if (clickable && r.leavingAt) continue;
      out.add(r.centerId);
      if (clickable && r !== cur) continue;
      for (const id of r.ids) out.add(id);
    }
    return out;
  }

  enterConstellation(ids: number[], layout: ConstellationPoint[]) {
    const valid = ids.filter((id) => this.index.has(id));
    if (valid.length < 2) return;
    if (this.constellation && !this.constellation.exitingAt && sameIds(this.constellation.ids, valid)) {
      this.constellation.layout = layout;
      this.constellation.box = this.layoutBox(layout);
      return;
    }
    this.constellation = { ids: valid, layout, box: this.layoutBox(layout), t0: performance.now(), exitingAt: null };
    this.route = valid;
    this.overlayReset();
  }

  exitConstellation() {
    if (!this.constellation || this.constellation.exitingAt) return;
    this.constellation.exitingAt = performance.now();
    this.route = [];
  }

  constellationK(now = performance.now()) {
    const c = this.constellation;
    if (!c) return 0;
    if (c.exitingAt) return 1 - easeInOut(Math.min(1, (now - c.exitingAt) / CONSTELLATION.exitMs));
    return easeInOut(Math.min(1, (now - c.t0) / CONSTELLATION.enterMs));
  }

  constellationPos(id: number): { x: number; y: number } | null {
    const c = this.constellation;
    if (!c) return null;
    const i = this.index.get(id);
    if (i == null) return null;
    const real = { x: this.pos[i * 2], y: this.pos[i * 2 + 1] };
    const p = c.layout.find((q) => q.musicId === id);
    if (!p) return real;
    const f = this.constellationRect();
    const fit = this.constellationFit();
    const k = this.constellationK();
    const o = this.overlay;

    const tx = f.cx + (p.x - fit.bx) * fit.s * o.zoom + o.dx;
    const ty = f.cy - (p.y - fit.by) * fit.s * o.zoom + o.dy;
    return { x: lerp(real.x, tx, k), y: lerp(real.y, ty, k) };
  }

  private constellationFit() {
    const b = this.constellation?.box;
    const f = this.constellationRect();
    if (!b) return { s: 1, bx: 0, by: 0 };

    const p = this.isNarrow() ? CONSTELLATION.padNarrow : CONSTELLATION.pad;
    const fw = f.x1 - f.x0;
    const fh = f.y1 - f.y0;

    const w = b.x1 - b.x0;
    const h = b.y1 - b.y0;
    const sx = w > 1e-4 ? Math.max(1, fw - Math.min(p.maxPx, fw * p.ratio) * 2) / w : Infinity;
    const sy = h > 1e-4 ? Math.max(1, fh - Math.min(p.maxPx, fh * p.ratio) * 2) / h : Infinity;
    const s = Math.min(sx, sy);
    return { s: Number.isFinite(s) ? s : 1, bx: (b.x0 + b.x1) / 2, by: (b.y0 + b.y1) / 2 };
  }

  private layoutBox(layout: ConstellationPoint[]) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of layout) {
      x0 = Math.min(x0, p.x);
      x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
    return Number.isFinite(x0) ? { x0, x1, y0, y1 } : { x0: 0, x1: 0, y0: 0, y1: 0 };
  }

  constellationIdSet(): Set<number> | null {
    return this.constellation ? new Set(this.constellation.ids) : null;
  }

  clickableOverlayIds(): Set<number> | null {
    if (this.constellationActive()) return this.constellationIdSet();
    if (this.probe && !this.probe.exitingAt) return this.probeIdSet(true);
    return null;
  }

  setGhost(id: number) {
    if (!this.index.has(id) || this.isAlive(id)) {
      this.ghost = null;
      return;
    }
    this.ghost = { musicId: id, t0: performance.now() };
    this.frameGhost();
  }

  private frameGhost() {
    const dir = this.ghostDir();
    if (!dir || this.follow || this.anim) return;
    const extent = this.starRadius();
    if (extent < 1) return;
    const f = this.freeRect();
    const R = Math.min(f.x1 - f.x0, f.y1 - f.y0) / 2;

    const target = R * GHOST.viewCloudRatio;
    const s = extent > target ? this.cam.s * (target / extent) : this.cam.s;

    const shift = (R * GHOST.viewShiftRatio) / s;
    this.touched = true;
    this.camTarget = { s, cx: this.cam.cx + dir.x * shift, cy: this.cam.cy - dir.y * shift };
  }

  clearGhost() {
    this.ghost = null;
  }

  private ghostDir(): { x: number; y: number } | null {
    if (!this.ghost) return null;
    const i = this.index.get(this.ghost.musicId);
    const myI = this.myId != null ? this.index.get(this.myId) : undefined;
    if (i == null || myI == null) return null;
    const a = this.songs[i].pc;
    const b = this.songs[myI].pc;
    const dx = a[0] - b[0];

    const dy = -(a[1] - b[1]);
    const d = Math.hypot(dx, dy);
    return d < 1e-6 ? { x: 0, y: -1 } : { x: dx / d, y: dy / d };
  }

  private starRadius() {
    const f = this.freeRect();
    let max = 0;
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i] || this.alpha[i] < 0.5) continue;
      const d = Math.hypot(this.pos[i * 2] - f.cx, this.pos[i * 2 + 1] - f.cy);
      if (d > max) max = d;
    }
    return max;
  }

  ghostPos(): { x: number; y: number } | null {
    const dir = this.ghostDir();
    return dir ? this.outsideCloudPos(dir, this.cloudExtent) : null;
  }

  private outsideCloudPos(dir: { x: number; y: number }, extent: number) {
    const f = this.freeRect();

    const x0 = f.x0 + GHOST.edgeInset;
    const x1 = Math.max(x0 + 1, f.x1 - GHOST.edgeInset);
    const y0 = f.y0 + GHOST.topInset;
    const y1 = Math.max(y0 + 1, f.y1 - GHOST.edgeInset);

    const tx = Math.abs(dir.x) < 1e-6 ? Infinity : ((dir.x > 0 ? x1 : x0) - f.cx) / dir.x;
    const ty = Math.abs(dir.y) < 1e-6 ? Infinity : ((dir.y > 0 ? y1 : y0) - f.cy) / dir.y;
    const t = Math.max(0, Math.min(extent + GHOST.cloudMargin, Math.min(tx, ty)));
    let x = f.cx + dir.x * t;
    let y = f.cy + dir.y * t;

    if (y < y0) {
      const side = dir.x >= 0 ? 1 : -1;
      const gap = Math.sqrt(Math.max(0, t * t - (y0 - f.cy) ** 2));
      y = y0;
      x = Math.min(x1, Math.max(x0, f.cx + side * Math.max(gap, t * 0.35)));
    }
    return { x, y };
  }

  ghostK(now = performance.now()) {
    return this.ghost ? easeInOut(Math.min(1, (now - this.ghost.t0) / GHOST.enterMs)) : 0;
  }

  hitGhost(mx: number, my: number): number | null {
    const p = this.ghostPos();
    if (!p || !this.ghost) return null;
    return (p.x - mx) ** 2 + (p.y - my) ** 2 < GHOST.hitRadius ** 2 ? this.ghost.musicId : null;
  }

  setObstacles(rects: { x0: number; y0: number; x1: number; y1: number }[]) {
    this.obstacles = rects;
  }

  private edgePos(dir: { x: number; y: number }) {
    const f = this.freeRect();
    const g = ME_OFFSCREEN.edgeGap;
    const x0 = f.x0 + g;
    const y0 = f.y0 + g;
    const x1 = Math.max(x0 + 1, f.x1 - g);
    const y1 = Math.max(y0 + 1, f.y1 - g);
    const want = Math.atan2(dir.y, dir.x);
    const step = 10;
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    let fallback: { x: number; y: number } | null = null;
    let fallbackD = Infinity;
    const consider = (x: number, y: number) => {
      let d = Math.abs(Math.atan2(y - f.cy, x - f.cx) - want);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < fallbackD) {
        fallbackD = d;
        fallback = { x, y };
      }
      if (this.blocked(x, y) || d >= bestD) return;
      bestD = d;
      best = { x, y };
    };
    for (let x = x0; x <= x1; x += step) {
      consider(x, y0);
      consider(x, y1);
    }
    for (let y = y0; y <= y1; y += step) {
      consider(x0, y);
      consider(x1, y);
    }

    return best ?? fallback ?? { x: f.cx, y: f.cy };
  }

  private blocked(x: number, y: number) {
    const g = ME_OFFSCREEN.edgeGap;
    return this.obstacles.some((o) => x > o.x0 - g && x < o.x1 + g && y > o.y0 - g && y < o.y1 + g);
  }

  rideMeScreen: { x: number; y: number } | null = null;

  mePos(): { x: number; y: number } | null {
    if (this.follow) return this.rideMeScreen;
    if (this.myId == null) return null;
    const { px, py } = this.worldToScreen(this.me.x, this.me.y, this.cam, this.parOf(this.playingId ?? this.myId));
    return { x: px, y: py };
  }

  friendScreenPos(email: string): { x: number; y: number } | null {
    const f = this.visFriends.find((v) => v.user.email === email || v.stacked.some((u) => u.email === email));
    if (f) return { x: f.px, y: f.py };

    return this.myQueueScreen.get(email) ?? null;
  }

  myQueueScreen = new Map<string, { x: number; y: number }>();

  friendNickname(email: string): string | null {
    for (const v of this.visFriends) {
      if (v.user.email === email) return v.user.nickname;
      const hit = v.stacked.find((u) => u.email === email);
      if (hit) return hit.nickname;
    }

    return this.myRiderUsers.find((u) => u.email === email)?.nickname ?? null;
  }

  meScreen(now = performance.now()): { px: number; py: number; from: { px: number; py: number } | null; onRing: boolean } {
    if (this.myId != null && this.probe && !this.probe.exitingAt) {
      const at = this.probePos(this.myId);
      if (at && this.overlaySlot(this.myId)) {
        const hop = this.meHop;
        if (hop) {
          const t = Math.min(1, (now - hop.t0) / ME_FLIGHT.hopMs);
          if (t >= 1) this.meHop = null;
          else {
            const e = easeInOut(t);
            return { px: lerp(hop.x, at.x, e), py: lerp(hop.y, at.y, e), from: { px: hop.x, py: hop.y }, onRing: true };
          }
        }
        return { px: at.x, py: at.y, from: null, onRing: true };
      }
    }
    this.meHop = null;
    const { px, py } = this.worldToScreen(this.me.x, this.me.y, this.cam, this.parOf(this.playingId ?? this.myId));
    const fl = this.meFlight;
    return { px, py, from: fl ? this.worldToScreen(fl.ax, fl.ay) : null, onRing: false };
  }

  meArrow(): { x: number; y: number; dir: { x: number; y: number }; elsewhere: boolean } | null {
    if (this.anim || this.follow || this.myId == null || this.constellationActive()) return null;
    const id = this.playingId ?? this.myId;

    if (this.probe && !this.probe.exitingAt && this.overlaySlot(id)) return null;

    const elsewhere = !this.inBranch(id);
    let dir: { x: number; y: number } | null;
    if (elsewhere) {
      dir = this.awayDir(id);
    } else {
      const { px, py } = this.worldToScreen(this.me.x, this.me.y, this.cam, this.parOf(this.playingId ?? this.myId));
      const f = this.freeRect();
      const m = ME_OFFSCREEN.inset;
      if (px > f.x0 + m && px < f.x1 - m && py > f.y0 + m && py < f.y1 - m) return null;
      dir = unit(px - f.cx, py - f.cy);
    }
    if (!dir) return null;

    const p = this.edgePos(dir);
    return { x: p.x, y: p.y, dir, elsewhere };
  }

  private awayDir(id: number): { x: number; y: number } | null {
    const i = this.index.get(id);
    if (i == null) return null;
    const pc = this.songs[i].pc;

    const h = this.home;
    const split = h && h.musicId === id ? sharedDepth(this.boxes, h.boxes) : null;
    const frame = split != null && split < this.layer ? this.stack.find((f) => f.layer === split) : undefined;
    if (frame && split != null) {
      const d = unit(pc[split * 2] - frame.cam.cx, -(pc[split * 2 + 1] - frame.cam.cy));
      if (d) return d;
    }
    for (let k = this.stack.length - 1; k >= 0; k--) {
      const f = this.stack[k];
      if (!f.subset[i]) continue;

      const d = unit(pc[f.layer * 2] - f.cam.cx, -(pc[f.layer * 2 + 1] - f.cam.cy));
      if (d) return d;
    }
    return unit(pc[this.dx()] - this.cam.cx, -(pc[this.dy()] - this.cam.cy));
  }

  constellationActive() {
    return !!this.constellation && !this.constellation.exitingAt;
  }

  private instrumentInset: number = CONSTELLATION.instrumentInsetPx;

  setInstrumentInset(px: number) {
    this.instrumentInset = px;
  }

  private constellationRect() {
    const base = this.overlayRect();
    const x0 = base.x0 + this.instrumentInset;
    const y1 = base.y1 - 20;
    return { x0, y0: base.y0, x1: base.x1, y1, cx: (x0 + base.x1) / 2, cy: (base.y0 + y1) / 2 };
  }

  private dx() {
    return this.layer * 2;
  }
  private dy() {
    return this.layer * 2 + 1;
  }

  freeRect() {
    return this.rectFor(this.occluded);
  }

  private rectFor(o: Occlusion) {
    const x0 = o.left;
    const x1 = Math.max(x0 + 120, this.W - o.right);
    const y0 = o.top;
    const y1 = Math.max(y0 + 120, this.H - o.bottom);
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  private overlayHold: { owner: object; W: number; H: number; settleUntil: number; rect: ReturnType<MapEngine["freeRect"]> } | null = null;

  overlayRect() {
    if (!this.isNarrow()) return this.freeRect();
    const p = this.probe;
    const c = this.constellation;
    const owner = p && !p.exitingAt ? p : c && !c.exitingAt ? c : (p ?? c);
    if (!owner) {
      this.overlayHold = null;
      return this.freeRect();
    }
    const now = performance.now();
    let h = this.overlayHold;
    if (!h || h.owner !== owner || h.W !== this.W || h.H !== this.H) {
      const settleUntil = owner === p && p ? p.rings[0].t0 + PROBE.enterMs : c ? c.t0 + CONSTELLATION.enterMs : now;
      h = this.overlayHold = { owner, W: this.W, H: this.H, settleUntil, rect: this.rectFor(this.occludedTarget) };
    }
    if (now < h.settleUntil) h.rect = this.rectFor(this.occludedTarget);
    return h.rect;
  }

  worldToScreen(x: number, y: number, cam = this.cam, p = 1) {
    return { px: this.W / 2 + (x - cam.cx) * cam.s * p, py: this.H / 2 - (y - cam.cy) * cam.s * p };
  }

  screenToWorld(px: number, py: number, cam = this.cam) {
    return { x: cam.cx + (px - this.W / 2) / cam.s, y: cam.cy - (py - this.H / 2) / cam.s };
  }

  viewBox(): LayerBox {
    const f = this.freeRect();
    const lo = this.screenToWorld(f.x0, f.y1);
    const hi = this.screenToWorld(f.x1, f.y0);
    return { layer: this.layer, xMin: lo.x, xMax: hi.x, yMin: lo.y, yMax: hi.y };
  }

  private par(i: number) {
    return 1 + this.z[i] * STAR_VIEW.parallax;
  }

  parOf(id: number | null): number {
    const i = id == null ? undefined : this.index.get(id);
    return i == null ? 1 : this.par(i);
  }

  depthScale(i: number): number {
    return 1 + this.z[i] * STAR_VIEW.depthSize;
  }

  depthScaleOf(id: number | null): number {
    const i = id == null ? undefined : this.index.get(id);
    return i == null ? 1 : this.depthScale(i);
  }

  private proj(i: number, layer: number, cam: MapCamera, out: Float32Array, k: number) {
    const s = this.songs[i];
    const p = this.par(i);
    out[k] = this.W / 2 + (s.pc[layer * 2] - cam.cx) * cam.s * p;
    out[k + 1] = this.H / 2 - (s.pc[layer * 2 + 1] - cam.cy) * cam.s * p;

    if (process.env.NODE_ENV !== "production" && !warnedNaN && !(Number.isFinite(out[k]) && Number.isFinite(out[k + 1]))) {
      warnedNaN = true;
      console.warn("[map] non-finite projection", { musicId: s.musicId, layer, pc: s.pc, cam, z: this.z[i] });
    }
  }

  private project() {
    for (let i = 0; i < this.N; i++) this.proj(i, this.layer, this.cam, this.pos, i * 2);
  }

  genreOf(id: number): number | null {
    const i = this.index.get(id);
    return i == null ? null : this.songs[i].genreId;
  }

  worldOf(id: number): { x: number; y: number } | null {
    const i = this.index.get(id);
    if (i == null) return null;
    const s = this.songs[i];
    return { x: s.pc[this.dx()], y: s.pc[this.dy()] };
  }

  isAlive(id: number) {
    const i = this.index.get(id);
    return i != null && this.subset[i] === 1;
  }

  hideSong(musicId: number): boolean {
    const i = this.index.get(musicId);
    if (i == null) return false;
    const inAnim = this.anim != null && this.anim.subset[i] === 1;
    if (this.subset[i] !== 1 && !inAnim) return false;
    this.subset[i] = 0;
    if (this.anim) this.anim.subset[i] = 0;
    this.rebuildAliveIdx();
    this.project();
    return true;
  }

  private centerMost() {
    let b = 0;
    let bd = 1e9;
    for (let i = 0; i < this.N; i++) {
      const d = Math.abs(this.songs[i].pc[0]) + Math.abs(this.songs[i].pc[1]);
      if (d < bd) {
        bd = d;
        b = i;
      }
    }
    return this.songs[b].musicId;
  }

  private fitCam(layer: number, mask: Uint8Array<ArrayBufferLike>, centerId: number): MapCamera {
    const dx = layer * 2;
    const dy = layer * 2 + 1;
    const c = this.songs[this.index.get(centerId)!];
    const f = this.freeRect();
    if (layer === 0) {
      const s = this.fitRadial(dx, dy, mask, c.pc);
      return this.saneCam({ cx: c.pc[dx] - (f.cx - this.W / 2) / s, cy: c.pc[dy] + (f.cy - this.H / 2) / s, s });
    }

    const b = this.fitBox(dx, dy, mask);
    return this.saneCam({ cx: b.cx - (f.cx - this.W / 2) / b.s, cy: b.cy + (f.cy - this.H / 2) / b.s, s: b.s });
  }

  private startCam0(mask: Uint8Array<ArrayBufferLike>, centerId: number): MapCamera {
    const s = this.fitBox(0, 1, mask).sCover;
    const c = this.songs[this.index.get(centerId)!];
    const f = this.freeRect();
    return this.saneCam({ cx: c.pc[0] - (f.cx - this.W / 2) / s, cy: c.pc[1] + (f.cy - this.H / 2) / s, s });
  }

  private saneCam(c: MapCamera): MapCamera {
    return Number.isFinite(c.s) && c.s > 0 && Number.isFinite(c.cx) && Number.isFinite(c.cy) ? c : { ...this.cam };
  }

  private fitRadial(dx: number, dy: number, mask: Uint8Array<ArrayBufferLike>, c: number[]) {
    const d: number[] = [];
    for (let i = 0; i < this.N; i++) if (mask[i]) d.push(Math.hypot(this.songs[i].pc[dx] - c[dx], this.songs[i].pc[dy] - c[dy]));
    d.sort((a, b) => a - b);
    const r = d[Math.floor(d.length * DRILL.fitQuantile)] || 1;
    const f = this.freeRect();
    return (Math.min(f.x1 - f.x0, f.y1 - f.y0) * DRILL.fitRadiusRatio) / r;
  }

  private fitBox(dx: number, dy: number, mask: Uint8Array<ArrayBufferLike>) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < this.N; i++) {
      if (!mask[i]) continue;
      xs.push(this.songs[i].pc[dx]);
      ys.push(this.songs[i].pc[dy]);
    }
    if (!xs.length) return { s: this.cam.s, sCover: this.cam.s, cx: this.cam.cx, cy: this.cam.cy };
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const lo = Math.floor((xs.length - 1) * DRILL.deepFit.trim);
    const hi = Math.ceil((xs.length - 1) * (1 - DRILL.deepFit.trim));
    const w = Math.max(1e-6, xs[hi] - xs[lo]);
    const h = Math.max(1e-6, ys[hi] - ys[lo]);
    const f = this.freeRect();
    const byW = ((f.x1 - f.x0) * DRILL.deepFit.fill) / w;
    const byH = ((f.y1 - f.y0) * DRILL.deepFit.fill) / h;

    return { s: Math.min(byW, byH), sCover: Math.max(byW, byH), cx: (xs[lo] + xs[hi]) / 2, cy: (ys[lo] + ys[hi]) / 2 };
  }

  private morph(newLayer: number, newCam: MapCamera, newSubset: Uint8Array<ArrayBufferLike>, big: string, dir: 1 | -1 = 1, entryS?: number, mode: "dive" | "fade" = "dive") {
    this.ghost = null;
    for (let i = 0; i < this.N; i++) {
      this.from[i * 2] = this.pos[i * 2];
      this.from[i * 2 + 1] = this.pos[i * 2 + 1];
      this.aFrom[i] = this.alpha[i];
    }
    this.aimAt(newLayer, newCam, newSubset);
    this.pressure = 0;
    this.prefetch = null;
    this.camTarget = null;

    this.centerHoldId = null;
    this.morphT = 0;
    this.anim = { t0: performance.now(), layer: newLayer, cam: newCam, subset: newSubset, big, dir, entryS, mode };
  }

  private aimAt(layer: number, cam: MapCamera, subset: Uint8Array<ArrayBufferLike>) {
    for (let i = 0; i < this.N; i++) {
      this.aTo[i] = subset[i] ? 1 : 0;
      this.proj(i, layer, cam, this.to, i * 2);
    }
  }

  private retarget(cam: MapCamera, subset: Uint8Array<ArrayBufferLike>) {
    const a = this.anim;
    if (!a) return;
    this.aimAt(a.layer, cam, subset);
    a.cam = cam;
    a.subset = subset;
  }

  zoomK() {
    return this.cam.s / this.entryS;
  }

  private zoomedEnough() {
    return this.zoomK() >= this.gateMinZoom() && this.countInView() <= this.gateMaxInView();
  }

  private gateMinZoom() {
    return this.layer === 0 ? DRILL.gateMinZoom.top : DRILL.gateMinZoom.deep;
  }

  private gateMaxInView() {
    const f = this.freeRect();
    const areaMpx = ((f.x1 - f.x0) * (f.y1 - f.y0)) / 1e6;
    return Math.max(DRILL.minInView, DRILL.gateMaxDensity * areaMpx);
  }

  gateProgress() {
    const byZoom = Math.min(1, this.zoomK() / this.gateMinZoom());
    const n = this.countInView();
    const max = this.gateMaxInView();
    const byCount = n <= max ? 1 : max / n;
    return Math.min(byZoom, byCount);
  }

  gateOpen() {
    return this.layer < LAYER_COUNT - 1 && this.zoomedEnough();
  }

  descend() {
    if (this.anim || this.pending || this.layer >= LAYER_COUNT - 1 || this.follow || !this.zoomedEnough()) return;

    const box = this.prefetch?.[this.layer] ?? this.drillBox();
    if (!this.prefetch) this.prefetch = [...this.boxes, box];
    this.pending = { box, inView: this.countInBox(box), since: performance.now(), s0: this.cam.s };

    this.pressure = 1;
    this.tryStartPending(performance.now());
  }

  setPrefetched(boxes: readonly LayerBox[], songs: MapPoint[]) {
    this.prefetched = { boxes, songs };
    if (this.pending) this.tryStartPending(performance.now());
  }

  private tryStartPending(now: number) {
    const p = this.pending;
    if (!p) return;
    const nl = this.layer + 1;
    const want = [...this.boxes, p.box];
    const ready = this.prefetched && sameBoxes(this.prefetched.boxes, want) ? this.prefetched.songs : null;
    if (!ready && now - p.since < DRILL.waitForLayerMs) return;
    this.pending = null;
    this.stack.push({ layer: this.layer, cam: { ...this.cam }, subset: this.subset.slice(), entryS: this.entryS });
    this.boxes = want;

    const big = `${LAYER_NAMES[nl]}${ro(LAYER_NAMES[nl])} 파고드는 중`;
    let ns: Uint8Array<ArrayBufferLike>;
    if (ready) {
      ns = this.maskFor(nl, ready);
    } else {
      ns = this.residentMask(nl);
      for (let i = 0; i < this.N; i++) if (!this.subset[i]) ns[i] = 0;

      this.keepDemo(ns, nl);
    }
    this.morph(nl, this.fitCam(nl, ns, this.fitAnchor(ns, nl)), ns, big);
  }

  private maskFor(layer: number, songs: MapPoint[]) {
    const add = songs.filter((s) => !this.index.has(s.musicId));
    if (add.length) this.allocate([...this.songs, ...add], this.N);
    const ns = new Uint8Array(this.N);
    for (const s of songs) ns[this.index.get(s.musicId)!] = 1;
    this.keepPinned(ns, layer);
    this.keepMine(ns, layer);
    this.keepDemo(ns, layer);
    return ns;
  }

  private countInBox(b: LayerBox) {
    const dx = b.layer * 2;
    const dy = b.layer * 2 + 1;
    let n = 0;
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i]) continue;
      const p = this.songs[i].pc;
      if (p[dx] >= b.xMin && p[dx] <= b.xMax && p[dy] >= b.yMin && p[dy] <= b.yMax) n++;
    }
    return n;
  }

  private drillBox(): LayerBox {
    const view = this.viewBox();
    if (this.countInBox(view) >= DRILL.minInView) return view;
    const dx = this.dx();
    const dy = this.dy();
    const f = this.freeRect();
    const c = this.screenToWorld(f.cx, f.cy);
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i]) continue;
      const p = this.songs[i].pc;
      const d = (p[dx] - c.x) ** 2 + (p[dy] - c.y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    if (best < 0) return view;
    const p = this.songs[best].pc;
    const hw = (view.xMax - view.xMin) / 2;
    const hh = (view.yMax - view.yMin) / 2;
    let box = view;
    for (let k = 1; k <= DRILL.nearestGrowMax; k *= DRILL.nearestGrowStep) {
      box = { layer: this.layer, xMin: p[dx] - hw * k, xMax: p[dx] + hw * k, yMin: p[dy] - hh * k, yMax: p[dy] + hh * k };
      if (this.countInBox(box) >= DRILL.minInView) break;
    }
    return box;
  }

  ascend() {
    this.ascendTo(this.layer - 1);
  }

  ascendTo(target: number, big?: string) {
    if (this.anim || this.pending || !this.stack.length || this.follow) return;
    if (target < 0 || target >= this.layer) return;
    let p = this.stack.pop()!;
    while (p.layer > target && this.stack.length) p = this.stack.pop()!;
    this.boxes = this.boxes.slice(0, p.layer);
    const dx = p.layer * 2;
    const dy = p.layer * 2 + 1;

    const s = p.entryS * DRILL.riseLandZoom;

    const mi0 = this.myId != null ? this.index.get(this.myId) : undefined;

    const mi = mi0 != null && this.inBranch(this.myId, p.layer, this.boxes) ? mi0 : undefined;
    if (mi != null && !p.subset[mi]) p.subset[mi] = 1;
    const f = this.freeRect();

    const c: MapCamera =
      mi == null
        ? { ...p.cam, s }
        : {
            ...p.cam,
            s,
            cx: this.songs[mi].pc[dx] - (f.cx - this.W / 2) / s,
            cy: this.songs[mi].pc[dy] + (f.cy - this.H / 2) / s,
          };
    this.morph(p.layer, c, p.subset, big ?? `${LAYER_NAMES[p.layer]}으로 떠오르는 중`, -1, p.entryS);
  }

  wheel(deltaY: number, mx: number, my: number): "zoom" | "pressure" | "blocked" {
    if (this.anim || this.pending) return "blocked";

    if (this.follow) return "blocked";

    this.centerLock = false;
    this.centerHoldId = null;
    const zoomIn = deltaY < 0;

    const riseAt = this.layer > 0 ? DRILL.deepZoomOutRatio : DRILL.riseScaleRatio;
    const intent = wheelIntent({
      zoomIn,
      gateOpen: this.gateOpen(),
      zoomedOutEnough: this.cam.s <= this.entryS * riseAt,
      hasStack: this.stack.length > 0,
    });
    const canDig = intent === "dig";
    if (intent !== "zoom") {
      this.pressureDir = canDig ? 1 : -1;

      if (canDig && !this.prefetch) this.prefetch = [...this.boxes, this.drillBox()];
      this.pressure = Math.min(1, this.pressure + Math.abs(deltaY) * DRILL.pressurePerDelta);
      if (this.pressure >= 1) {
        if (canDig) this.descend();
        else this.ascend();
      }
      return "pressure";
    }
    this.camTarget = null;
    this.touched = true;
    this.prefetch = null;
    const w = this.screenToWorld(mx, my);
    const want = this.cam.s * Math.exp(-deltaY * WHEEL_ZOOM);

    const minK = this.layer > 0 ? DRILL.deepZoomOutRatio : DRILL.zoomRange.min;
    this.cam.s = Math.min(this.entryS * DRILL.zoomRange.max, Math.max(this.entryS * minK, want));
    this.cam.cx = w.x - (mx - this.W / 2) / this.cam.s;
    this.cam.cy = w.y + (my - this.H / 2) / this.cam.s;
    this.clampCam();
    this.project();
    return "zoom";
  }

  dragBy(dx: number, dy: number) {
    if (this.anim || this.pending || this.follow) return;
    this.camTarget = null;
    this.prefetch = null;
    this.touched = true;
    this.centerLock = false;
    this.centerHoldId = null;
    this.cam.cx -= dx / this.cam.s;
    this.cam.cy += dy / this.cam.s;
    this.clampCam();
    this.project();
  }

  setCameraCenter(x: number, y: number) {
    if (this.anim || this.follow) return;
    this.camTarget = { ...this.cam, cx: x, cy: y };
  }

  private camCentering(w: { x: number; y: number }, s: number): MapCamera {
    const f = this.freeRect();
    return { s, cx: w.x - (f.cx - this.W / 2) / s, cy: w.y + (f.cy - this.H / 2) / s };
  }

  focus(id: number, scaleMul?: number) {
    const w = this.worldOf(id);
    if (!w || !this.isAlive(id) || this.follow) return;
    this.touched = true;
    this.camTarget = this.camCentering(w, scaleMul ? Math.max(this.cam.s, this.entryS * scaleMul) : this.cam.s);
  }

  viewSong(id: number) {
    if (this.follow || this.constellationActive()) return;
    this.centerHoldId = id;
    this.centerLock = true;
    this.focus(id);
  }

  focusSong(id: number, targetLayer?: number | null) {
    this.centerLock = false;
    this.centerHoldId = null;
    if (this.follow || this.anim || !this.index.has(id)) return;
    this.selectedId = id;
    const s = this.songs[this.index.get(id)!];
    if (targetLayer == null || targetLayer === this.layer) {
      this.focus(id, FOCUS.zoomMul);
      return;
    }
    if (targetLayer < 0 || targetLayer >= LAYER_COUNT) return;

    const fr = this.freeRect();
    const scale = this.entryS * FOCUS.zoomMul;
    const cam: MapCamera = {
      s: scale,
      cx: s.pc[targetLayer * 2] - (fr.cx - this.W / 2) / scale,
      cy: s.pc[targetLayer * 2 + 1] + (fr.cy - this.H / 2) / scale,
    };
    this.touched = true;
    this.morph(
      targetLayer,
      cam,
      this.subset,
      `${s.title} — ${LAYER_NAMES[targetLayer]}${ro(LAYER_NAMES[targetLayer])}`,
      targetLayer > this.layer ? 1 : -1,
    );
  }

  hitHopLink(mx: number, my: number): { id: number } | null {
    const l = this.hopLink;
    if (!l) return null;
    return mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h ? { id: l.id } : null;
  }

  startHold(id: number) {
    this.hold = { id, t0: performance.now() };
  }

  cancelHold() {
    this.hold = null;
  }

  holdK(now = performance.now()) {
    return this.hold ? Math.min(1, (now - this.hold.t0) / HOLD.ms) : 0;
  }

  screenPosOf(id: number): { x: number; y: number } | null {
    const ov = this.probePos(id) ?? this.constellationPos(id);
    if (ov) return ov;
    const i = this.index.get(id);
    return i == null ? null : { x: this.pos[i * 2], y: this.pos[i * 2 + 1] };
  }

  pickTutorialStar(cardBottom: number): number | null {
    const f = this.freeRect();
    const inView = (v: VisibleStar) => v.px > f.x0 + 40 && v.px < f.x1 - 40 && v.py > f.y0 + 40 && v.py < f.y1 - 40;

    const clear = (v: VisibleStar) => !this.blocked(v.px, v.py);
    const tries = [
      (v: VisibleStar) => inView(v) && v.py > cardBottom && clear(v),
      (v: VisibleStar) => inView(v) && clear(v),
      inView,
      () => true, //                                                     보이기만 하면
    ];
    const ok = tries.map((t) => this.visible.filter(t)).find((list) => list.length > 0);
    if (!ok) return null;

    const bright = [...ok].sort((a, b) => this.songs[b.i].weight - this.songs[a.i].weight).slice(0, Math.max(1, Math.ceil(ok.length / 2)));
    return this.songs[bright[Math.floor(Math.random() * bright.length)].i].musicId;
  }

  private pcStatsCache: { mean: number[]; sd: number[] } | null = null;

  pcStats() {
    if (this.pcStatsCache) return this.pcStatsCache;
    const n = this.songs.length;
    const dims = this.songs[0]?.pc.length ?? 0;
    if (!n || !dims) return null;
    const mean = new Array<number>(dims).fill(0);
    for (const s of this.songs) for (let d = 0; d < dims; d++) mean[d] += s.pc[d];
    for (let d = 0; d < dims; d++) mean[d] /= n;
    const sd = new Array<number>(dims).fill(0);
    for (const s of this.songs) for (let d = 0; d < dims; d++) sd[d] += (s.pc[d] - mean[d]) ** 2;

    for (let d = 0; d < dims; d++) sd[d] = Math.sqrt(sd[d] / n) || 1;
    this.pcStatsCache = { mean, sd };
    return this.pcStatsCache;
  }

  starPos(musicId: number): { x: number; y: number; r: number } | null {
    const i = this.index.get(musicId);
    if (i == null) return null;
    const v = this.visible.find((x) => x.i === i);
    return v ? { x: v.px, y: v.py, r: v.r } : null;
  }

  hitTest(mx: number, my: number): VisibleStar | null {
    let best: VisibleStar | null = null;
    let bd = 1e9;

    const gate = this.clickableOverlayIds();

    for (const list of [this.visible, this.coverHits]) {
      for (const v of list) {
        if (gate && !gate.has(this.songs[v.i].musicId)) continue;
        const d = (v.px - mx) ** 2 + (v.py - my) ** 2;
        if (d < v.r * v.r && d < bd) {
          bd = d;
          best = v;
        }
      }
    }
    return best;
  }

  hitFriend(mx: number, my: number): VisibleFriend | null {
    let best: VisibleFriend | null = null;
    let bd = FRIEND_MARKER.hitPx * FRIEND_MARKER.hitPx;
    for (const fr of this.visFriends) {
      const d = (fr.px - mx) ** 2 + (fr.py - my) ** 2;
      if (d < bd) {
        bd = d;
        best = fr;
      }
    }
    return best;
  }

  songUnder(fr: VisibleFriend): VisibleStar | null {
    return this.hitTest(fr.px, fr.py);
  }

  expandStack(email: string): void {
    this.expandedStack = { email, since: performance.now() };
  }

  collapseStack(): void {
    this.expandedStack = null;
  }

  private spreadExpandedStack(): void {
    const ex = this.expandedStack;
    if (!ex) return;
    const at = this.visFriends.findIndex((v) => v.user.email === ex.email);
    const under = at < 0 ? null : this.songUnder(this.visFriends[at]);
    if (at < 0 || (this.visFriends[at].stacked.length === 0 && !under)) {
      this.expandedStack = null;
      return;
    }
    const v = this.visFriends[at];
    const people = [v.user, ...v.stacked];
    const n = people.length;

    const front = Math.max(v.scale, 1 + STAR_VIEW.depthSize);
    const k = springOut((performance.now() - ex.since) / FRIEND_SPREAD.durationMs);
    const scale = v.scale + (front - v.scale) * k;
    const R = FRIEND_MARKER.radiusPx * front;

    const nameW = Math.max(0, ...people.map((u) => approxNameWidth(u.nickname ?? "")));
    const fit = n === 1 ? 0 : (Math.max(2 * R, nameW) + FRIEND_SPREAD.gapPx) / (2 * Math.sin(Math.PI / n));

    const clear = under ? under.r + R + FRIEND_SPREAD.gapPx : 0;
    const radius = Math.max(FRIEND_SPREAD.radiusPx * front, fit, clear) * k;
    const parts: VisibleFriend[] = people.map((u, i) => {
      const a = n === 2 ? (i === 0 ? Math.PI : 0) : -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return { user: u, px: v.px + Math.cos(a) * radius, py: v.py + Math.sin(a) * radius, heading: v.heading, scale, isLeader: false, spread: true, stacked: [] };
    });
    this.visFriends.splice(at, 1, ...parts);
  }

  acceptsAnchor(id: number): boolean {
    return acceptsAnchor(this.travelToId, id);
  }

  setMy(id: number | null) {
    if (id == null || !this.index.has(id)) return;

    const changed = this.home?.musicId !== id;
    this.myId = id;
    this.playingId = id;
    if (changed) this.home = { musicId: id, boxes: [...this.boxes] };

    this.centerLock = true;
    this.centerHoldId = null;

    if (this.pinned && this.pinned.id !== id) this.pinned = null;
    const w = this.worldOf(id)!;
    this.me = { ...w };
  }

  travelTo(id: number) {
    this.playingId = id;
    this.home = { musicId: id, boxes: [...this.boxes] };

    this.centerLock = true;
    this.centerHoldId = null;

    if (this.pinned && this.pinned.id !== id) this.pinned = null;

    if (this.follow) {
      this.meHop = null;
      this.meFlight = null;
      this.travelToId = null;
      return;
    }

    if (!this.index.has(id)) return;

    if (this.probe && !this.probe.exitingAt && this.overlaySlot(id)) {
      const from = this.meScreen();
      this.meHop = { x: from.px, y: from.py, t0: performance.now() };
      this.meFlight = null;
      this.travelToId = null;
      this.myId = id;
      const w = this.worldOf(id);
      if (w && this.isAlive(id)) this.me = { ...w };
      return;
    }
    this.meHop = null;

    if (!this.isAlive(id) && this.inBranch(id)) {
      const i = this.index.get(id)!;
      this.subset[i] = 1;
      this.alpha[i] = 1;
      this.rebuildAliveIdx();
      this.project();
    }
    if (!this.isAlive(id)) {
      this.travelToId = null;
      return;
    }
    this.travelToId = id;

    const to = this.worldOf(id)!;
    const dx = to.x - this.me.x;
    const dy = to.y - this.me.y;
    const d = Math.hypot(dx, dy);
    this.meFlight = {
      ax: this.me.x,
      ay: this.me.y,
      bx: to.x,
      by: to.y,

      cx: (this.me.x + to.x) / 2 - dy * ME_FLIGHT.bow * (id % 2 ? 1 : -1),
      cy: (this.me.y + to.y) / 2 + dx * ME_FLIGHT.bow * (id % 2 ? 1 : -1),
      t0: performance.now(),
    };
    if (d < 1e-6) this.meFlight = null;

    if (!this.follow && !this.constellationActive()) this.focus(id);
  }

  private inBranch(id: number | null, layer = this.layer, boxes: readonly LayerBox[] = this.boxes): boolean {
    if (id == null) return false;
    const i = this.index.get(id);
    if (i == null || !insideBoxes(this.songs[i].pc, boxes, layer)) return false;

    const h = this.home;
    if (h && h.musicId === id) return sharedDepth(boxes.slice(0, layer), h.boxes) === layer;
    return true;
  }

  private keepMine(mask: Uint8Array, layer: number, boxes: readonly LayerBox[] = this.boxes) {
    const id = this.playingId ?? this.myId;
    if (id == null || !this.inBranch(id, layer, boxes)) return;
    const i = this.index.get(id);
    if (i != null && !this.songs[i].ghostOnly) mask[i] = 1;
  }

  playingElsewhere() {
    return this.playingId != null && !this.inBranch(this.playingId);
  }

  private centerOn(id: number, scaleMul?: number) {
    const w = this.worldOf(id);
    if (!w) return;
    this.touched = true;
    this.camTarget = this.camCentering(w, scaleMul ? Math.max(this.cam.s, this.entryS * scaleMul) : this.cam.s);
    this.centerLock = true;
    this.centerHoldId = null;
  }

  private pinned: { id: number; layer: number } | null = null;

  private fitMask(m: Uint8Array): Uint8Array {
    if (m.length === this.N) return m.slice();
    const out = new Uint8Array(this.N);
    out.set(m.subarray(0, Math.min(m.length, this.N)));
    return out;
  }

  private keepPinned(mask: Uint8Array, layer: number) {
    if (!this.pinned || this.pinned.layer !== layer) return;
    const i = this.index.get(this.pinned.id);
    if (i != null) mask[i] = 1;
  }

  private keepDemo(mask: Uint8Array, layer: number, boxes: readonly LayerBox[] = this.boxes) {
    for (const id of this.demoIds) {
      const i = this.index.get(id);
      if (i != null) mask[i] = this.demoVisible(i, layer, boxes) ? 1 : 0;
    }
  }

  setDemoIds(ids: Iterable<number>, minLayer: ReadonlyMap<number, number> = new Map()) {
    this.demoIds = new Set(ids);
    this.demoMinLayer = new Map(minLayer);
    let changed = false;
    for (const id of this.demoIds) {
      const i = this.index.get(id);
      if (i == null) continue;
      this.z[i] = DEMO_PIN.z;

      const show = this.demoVisible(i, this.layer) ? 1 : 0;
      if (this.subset[i] !== show) {
        this.subset[i] = show;
        this.alpha[i] = show;
        changed = true;
      }
      if (this.anim) {
        const to = this.demoVisible(i, this.anim.layer) ? 1 : 0;
        if (this.anim.subset[i] !== to) {
          this.anim.subset[i] = to;
          this.aTo[i] = to;
        }
      }
    }
    if (changed) this.rebuildAliveIdx();
    this.project();
  }

  private settleHome(i: number) {
    const id = this.songs[i].musicId;
    this.pinned = { id, layer: this.layer };
    if (!this.subset[i]) {
      this.subset[i] = 1;
      this.alpha[i] = 1;
      this.rebuildAliveIdx();
      this.project();
    }
    this.myId = id;
    this.me = { ...this.worldOf(id)! };
    this.meFlight = null;
  }

  canGoHome() {
    return this.home != null;
  }

  private maskForBoxes(boxes: readonly LayerBox[], upTo: number) {
    const m = this.residentMask(upTo);
    for (let i = 0; i < this.N; i++) {
      if (!m[i]) continue;
      const pc = this.songs[i].pc;
      for (let l = 0; l < upTo; l++) {
        const b = boxes[l];
        const x = pc[b.layer * 2];
        const y = pc[b.layer * 2 + 1];
        if (x < b.xMin || x > b.xMax || y < b.yMin || y > b.yMax) {
          m[i] = 0;
          break;
        }
      }
    }

    this.keepDemo(m, upTo, boxes);
    return m;
  }

  goHome(): GoHomeResult {
    const h = this.home;
    if (!h) return "none";
    const i = this.index.get(h.musicId);

    if (i == null) return "unknown";

    if (this.follow) return "follow";

    if ((this.probe && !this.probe.exitingAt) || this.constellationActive()) return "overlay";

    if (this.anim) {
      this.pendingHome = true;
      return "queued";
    }
    this.ghost = null;
    this.camTarget = null;
    const target = h.boxes.length;
    const route = homeRoute(this.boxes, h.boxes);

    if (route.riseTo === this.layer && route.dives.length === 0) {
      this.settleHome(i);
      this.centerOn(h.musicId, FOCUS.zoomMul);
      return "moved";
    }

    if (route.riseTo < this.layer || route.dives.length) {
      this.pinned = { id: h.musicId, layer: target };
      this.homeRoute = { musicId: h.musicId, dives: [...route.dives] };
      if (route.riseTo < this.layer) {
        this.ascendTo(route.riseTo, HOME_BIG);
        if (this.anim) {
          this.homeTraveling = true;
          return "moved";
        }
        this.homeRoute = null;
      } else {
        this.continueHomeRoute();
        if (this.anim) {
          this.homeTraveling = true;
          return "moved";
        }
        this.homeRoute = null;
      }
    }

    const ns = this.maskForBoxes(h.boxes, target);

    this.pinned = { id: h.musicId, layer: target };
    ns[i] = 1;

    this.stack = Array.from({ length: target }, (_, l) => {
      const sub = this.maskForBoxes(h.boxes, l);

      const cam = this.fitCam(l, sub, h.musicId);
      return { layer: l, cam, subset: sub, entryS: cam.s };
    });
    this.boxes = [...h.boxes];

    const song = this.songs[i];
    this.centerAfterMorph = h.musicId;

    this.myId = h.musicId;
    this.meFlight = null;
    const scale = this.fitCam(target, ns, h.musicId).s * FOCUS.zoomMul;
    const f = this.freeRect();
    this.touched = true;

    this.homeRoute = { musicId: h.musicId, dives: [] };
    this.homeTraveling = true;
    this.morph(
      target,
      { s: scale, cx: song.pc[target * 2] - (f.cx - this.W / 2) / scale, cy: song.pc[target * 2 + 1] + (f.cy - this.H / 2) / scale },
      ns,
      HOME_BIG,
      target > this.layer ? 1 : -1,
    );
    return "moved";
  }

  private continueHomeRoute() {
    const r = this.homeRoute;
    if (!r) return;
    this.homeRoute = null;
    const i = this.index.get(r.musicId);
    if (i == null) {
      this.homeTraveling = false;
      return;
    }
    if (!r.dives.length) {
      this.settleHome(i);
      this.centerOn(r.musicId, FOCUS.zoomMul);

      this.homeTraveling = false;
      return;
    }
    const target = this.layer + r.dives.length;
    for (let l = this.layer; l < target; l++) {
      const boxesAt = [...this.boxes, ...r.dives.slice(0, l - this.layer)];
      const sub = l === this.layer ? this.subset.slice() : this.maskForBoxes(boxesAt, l);
      if (l !== this.layer) sub[i] = 1;
      const cam = l === this.layer ? { ...this.cam } : this.fitCam(l, sub, r.musicId);
      this.stack.push({ layer: l, cam, subset: sub, entryS: l === this.layer ? this.entryS : cam.s });
    }
    this.boxes = [...this.boxes, ...r.dives];
    const ns = this.maskForBoxes(this.boxes, target);
    ns[i] = 1;
    const song = this.songs[i];
    const scale = this.fitCam(target, ns, r.musicId).s * FOCUS.zoomMul;
    const f = this.freeRect();
    this.centerAfterMorph = r.musicId;
    this.myId = r.musicId;
    this.meFlight = null;
    this.touched = true;
    this.morph(target, { s: scale, cx: song.pc[target * 2] - (f.cx - this.W / 2) / scale, cy: song.pc[target * 2 + 1] + (f.cy - this.H / 2) / scale }, ns, HOME_BIG, 1);

    this.homeRoute = { musicId: r.musicId, dives: [] };
  }

  revealSong(id: number): "focused" | "risen" | "surfaced" | "none" {
    if (this.follow || this.anim || this.pending || !this.index.has(id)) return "none";

    if (this.isAlive(id)) {
      this.ghost = null;
      this.focusSong(id);
      return "focused";
    }
    const i = this.index.get(id)!;
    const target = nearestLayerWith(this.stack, i);
    if (target != null) {
      this.ghost = null;
      this.selectedId = id;

      this.centerAfterMorph = id;
      this.ascendTo(target);
      return "risen";
    }

    if (this.layer === 0) {
      this.ghost = null;
      this.pinSong(i);
      this.focusSong(id);
      return "focused";
    }
    this.surfaceToSong(id);
    return "surfaced";
  }

  private pinSong(i: number) {
    this.pinned = { id: this.songs[i].musicId, layer: this.layer };
    if (this.subset[i]) return;
    this.subset[i] = 1;
    this.alpha[i] = 1;
    this.rebuildAliveIdx();
    this.project();
  }

  surfaceToSong(id: number) {
    if (this.follow || this.anim || !this.index.has(id)) return;

    const ns = this.fitMask(this.stack[0]?.subset ?? this.subset);

    const i = this.index.get(id)!;
    ns[i] = 1;
    this.pinned = { id, layer: 0 };
    this.ghost = null;
    this.stack = [];
    this.boxes = [];
    this.selectedId = id;
    const scale = this.fitCam(0, ns, id).s * FOCUS.zoomMul;
    const f = this.freeRect();
    const s = this.songs[this.index.get(id)!];

    this.morph(
      0,
      { s: scale, cx: s.pc[0] - (f.cx - this.W / 2) / scale, cy: s.pc[1] + (f.cy - this.H / 2) / scale },
      ns,
      `${s.title} — ${LAYER_NAMES[0]}${ro(LAYER_NAMES[0])} 떠오르는 중`,
      -1,
    );
  }

  startFollow(leader: NearbyUser, driven = false) {
    if (!this.index.has(leader.musicId)) return;

    if (!shouldRestartFollow(this.follow ? { email: this.follow.leader.email, layer: this.followLayer } : null, { email: leader.email, layer: this.layer })) {
      const f = this.follow!;
      f.leader = { ...f.leader, nickname: leader.nickname, imageUrl: leader.imageUrl, riderCount: leader.riderCount };

      if (leader.musicId !== f.playingMusicId && f.mv?.toId !== leader.musicId) {
        f.viewingMusicId = this.index.has(leader.viewingMusicId) ? leader.viewingMusicId : leader.musicId;
        this.launchLeaderMove(performance.now(), f, leader.musicId, { notify: false });
      }
      return;
    }
    this.travelToId = null;
    this.camTarget = null;

    this.constellation = null;
    this.route = [];
    const viewingMusicId = this.index.has(leader.viewingMusicId) ? leader.viewingMusicId : leader.musicId;
    this.follow = {
      leader,
      driven,
      viewingMusicId,
      playingMusicId: leader.musicId,

      phase: "play",
      nextAt: performance.now() + FOLLOW.viewToPlayMs,
      hops: 0,
      mv: null,
      visited: [],
    };
    this.followLayer = this.layer;

    if (!driven) this.onLeaderViewingChange?.(viewingMusicId);
  }

  rideTo(musicId: number) {
    const f = this.follow;
    if (!f || !this.index.has(musicId)) return;
    f.viewingMusicId = musicId;
    this.launchLeaderMove(performance.now(), f, musicId, { notify: false });
  }

  rideViewing(musicId: number) {
    const f = this.follow;
    if (!f || !this.index.has(musicId)) return;
    f.viewingMusicId = musicId;
  }

  settleAfterRide(musicId: number) {
    this.travelToId = null;
    this.meFlight = null;
    this.meHop = null;
    const i = this.index.get(musicId);
    if (i == null) return;
    if (!this.subset[i]) {
      this.subset[i] = 1;
      this.alpha[i] = 1;
      this.rebuildAliveIdx();
      this.project();
    }
    this.myId = musicId;
    this.playingId = musicId;
    this.home = { musicId, boxes: [...this.boxes] };
    this.me = { ...this.worldOf(musicId)! };
    this.centerHoldId = null;
    this.centerLock = true;
  }

  stopFollow() {
    if (!this.follow) return;
    const f = this.follow;
    this.follow = null;
    const w = this.worldOf(f.mv?.toId ?? f.leader.musicId);
    if (w) {
      this.me = { ...w };
      this.myId = f.mv?.toId ?? f.leader.musicId;
    }
  }

  private stepLeader(now: number) {
    const f = this.follow!;
    if (f.phase === "view") this.leaderPicksSong(now, f);
    else this.leaderPlaysSong(now, f);
  }

  private leaderPicksSong(now: number, f: FollowState) {
    f.hops++;
    if (f.hops > FOLLOW.maxHops) {
      const who = f.leader.nickname ?? "인솔자";

      this.stopFollow();
      this.onFollowEnd?.(`${who} 님이 접속을 종료해 따라가기가 끝났습니다.`);
      return;
    }

    if (f.hops > 1 && f.hops % FOLLOW.layerChangeEvery === 0 && this.leaderChangesLayer(f)) return;

    const from = this.friendPos.get(f.leader.email) ?? this.worldOf(f.playingMusicId);
    if (!from) return;
    const next = this.pickNearbySong(from, f.viewingMusicId, f.playingMusicId);
    if (next == null) return;
    f.viewingMusicId = next;
    f.phase = "play";
    f.nextAt = now + FOLLOW.viewToPlayMs;
    this.onLeaderViewingChange?.(next);
  }

  private leaderPlaysSong(now: number, f: FollowState) {
    if (!this.launchLeaderMove(now, f, f.viewingMusicId, { notify: true })) return;
    f.phase = "view";
    f.nextAt = now + FOLLOW.moveMs + FOLLOW.playToViewMs;
  }

  private launchLeaderMove(now: number, f: FollowState, toId: number, { notify }: { notify: boolean }): boolean {
    const target = this.worldOf(toId);
    const known = this.friendPos.get(f.leader.email);
    const from = known ?? this.worldOf(f.playingMusicId);
    if (!target || !from) return false;

    f.mv = { ...arcBetween(from, target, now, FOLLOW.moveMs, FOLLOW.bow), toId };
    f.visited.push(toId);
    if (notify) this.onArrive?.(toId);
    return true;
  }

  private leaderChangesLayer(f: FollowState): boolean {
    const dir = this.layer >= LAYER_COUNT - 1 ? -1 : this.layer <= 0 ? 1 : Math.random() < 0.6 ? 1 : -1;

    if (!this.rideToLayer(this.layer + dir)) return false;
    f.phase = "view";
    f.nextAt = performance.now() + DRILL.morphMs + FOLLOW.playToViewMs;
    return true;
  }

  rideToLayer(target: number, anchorMusicId?: number): boolean {
    if (target < 0 || target >= LAYER_COUNT || target === this.layer) return false;
    const f = this.follow;

    const anchor = anchorMusicId ?? f?.viewingMusicId;
    const at = anchor == null ? null : this.index.get(anchor);
    if (at == null) return false;

    const view = { x: this.songs[at].pc[target * 2], y: this.songs[at].pc[target * 2 + 1] };
    const fr = this.freeRect();
    const s = this.entryS * FOLLOW.zoomMul;
    const cam: MapCamera = { s, cx: view.x - (fr.cx - this.W / 2) / s, cy: view.y + (fr.cy - this.H / 2) / s };

    if (target > this.layer) {
      const box = this.viewBox();
      const grown = [...this.boxes];
      while (grown.length < target) grown.push(box);
      this.boxes = grown;
    } else {
      this.boxes = this.boxes.slice(0, target);
    }

    const known = new Map(this.stack.map((fr) => [fr.layer, fr]));
    known.set(this.layer, { layer: this.layer, cam: { ...this.cam }, subset: this.subset.slice(), entryS: this.entryS });
    this.stack = Array.from({ length: target }, (_, l) => {
      const have = known.get(l);
      if (have) return have;
      const sub = this.maskForBoxes(this.boxes, l);
      const c = this.fitCam(l, sub, this.songs[at].musicId);
      return { layer: l, cam: c, subset: sub, entryS: c.s };
    });

    if (f) this.friendPos.delete(f.leader.email);
    this.morph(target, cam, this.subset, `${f?.leader.nickname ?? "인솔자"} 님을 따라 ${LAYER_NAMES[target]}${ro(LAYER_NAMES[target])}`);
    return true;
  }

  private pickNearbySong(from: { x: number; y: number }, ...exclude: number[]): number | null {
    const skip = new Set(exclude);
    const cands: { i: number; d: number }[] = [];
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i] || !this.songs[i].playable) continue;
      const s = this.songs[i];
      if (skip.has(s.musicId)) continue;
      const d = Math.hypot(s.pc[this.dx()] - from.x, s.pc[this.dy()] - from.y);
      if (d < 0.02) continue;
      cands.push({ i, d });
    }
    if (!cands.length) return null;
    cands.sort((a, b) => a.d - b.d);
    const pool = cands.slice(0, 8);
    return this.songs[pool[Math.floor(Math.random() * pool.length)].i].musicId;
  }

  frame(now: number) {
    this.time = now / 1000;
    if (!this.inited) return;

    for (const edge of OCCLUSION_EDGES) {
      const to = this.occludedTarget[edge];
      if (this.occluded[edge] === to) continue;
      this.occluded[edge] = lerp(this.occluded[edge], to, OCCLUSION_EASE);

      if (Math.abs(this.occluded[edge] - to) < 0.5) this.occluded[edge] = to;
    }

    const viewBusy = (!!this.probe && !this.probe.exitingAt) || this.constellationActive();
    if (this.centerLock && !this.camTarget && !this.anim && !this.follow && !viewBusy) {
      const id = this.centerHoldId ?? this.playingId ?? this.myId;
      const w = id != null ? this.worldOf(id) : null;
      if (w) {
        const { cx, cy } = this.camCentering(w, this.cam.s);
        if (Math.abs(cx - this.cam.cx) * this.cam.s > 0.4 || Math.abs(cy - this.cam.cy) * this.cam.s > 0.4) {
          this.cam.cx = lerp(this.cam.cx, cx, OCCLUSION_EASE);
          this.cam.cy = lerp(this.cam.cy, cy, OCCLUSION_EASE);
          this.project();
        }
      }
    }

    if (this.anim) {
      const fade = this.anim.mode === "fade";
      const t = Math.min(1, (now - this.anim.t0) / (fade ? DRILL.swapMs : DRILL.morphMs));
      const e = easeInOut(t);
      const f = this.freeRect();
      const dir = this.anim.dir;

      const eOut = Math.pow(e, DRILL.dive.outEase);
      const sOut = fade ? 1 : dir > 0 ? lerp(1, DRILL.dive.out, eOut) : lerp(1, DRILL.dive.in, eOut);
      const sIn = fade ? 1 : dir > 0 ? lerp(DRILL.dive.in, 1, e) : lerp(DRILL.dive.out, 1, e);

      this.morphT = e;
      const aOut = fade ? 1 - e : Math.pow(1 - e, 1.15);
      const aIn = fade ? e : Math.min(1, Math.max(0, e / 0.42));
      for (let i = 0; i < this.N; i++) {
        this.posOut[i * 2] = f.cx + (this.from[i * 2] - f.cx) * sOut;
        this.posOut[i * 2 + 1] = f.cy + (this.from[i * 2 + 1] - f.cy) * sOut;
        this.alphaOut[i] = this.aFrom[i] * aOut;
        this.pos[i * 2] = f.cx + (this.to[i * 2] - f.cx) * sIn;
        this.pos[i * 2 + 1] = f.cy + (this.to[i * 2 + 1] - f.cy) * sIn;
        this.alpha[i] = this.aTo[i] * aIn;
      }
      if (t >= 1) {
        const a = this.anim;
        this.anim = null;
        this.layer = a.layer;
        this.cam = a.cam;

        this.entryS = a.entryS ?? a.cam.s;
        this.subset = a.subset;
        this.rebuildAliveIdx();
        this.alpha = this.aTo.slice();
        this.alphaOut.fill(0);
        this.morphT = 0;
        const w = this.myId != null ? this.worldOf(this.myId) : null;
        if (w) this.me = { ...w };
        if (this.selectedId != null && !this.isAlive(this.selectedId)) this.selectedId = null;
        this.project();

        if (this.centerAfterMorph != null) {
          const id = this.centerAfterMorph;
          this.centerAfterMorph = null;
          this.centerOn(id, FOCUS.zoomMul);
        }

        if (this.homeRoute) this.continueHomeRoute();

        if (this.pendingHome) {
          this.pendingHome = false;
          this.goHome();
        }
      }
    } else {
      if (this.pending) {
        const k = 1 + DRILL.waitZoom * (1 - Math.exp(-(now - this.pending.since) / DRILL.waitZoomTauMs));
        this.cam.s = this.pending.s0 * k;
        this.project();
        this.tryStartPending(now);
      } else if (this.pressure > 0) {
        this.pressure = Math.max(0, this.pressure - DRILL.pressureDecay);
        if (this.pressure === 0) this.prefetch = null;
      }

      if (this.overlayFocusId != null) {
        const t = this.overlayDest(this.overlayFocusId, this.overlayFocusZoom);
        if (!t || !this.constellationActive()) this.overlayFocusId = null;
        else {
          const o = this.overlay;
          const k = 1 - Math.pow(0.001, 16 / 1000) * 0.85;
          o.zoom = lerp(o.zoom, this.overlayFocusZoom, k);
          o.dx = lerp(o.dx, t.dx, k);
          o.dy = lerp(o.dy, t.dy, k);

          if (Math.abs(o.dx - t.dx) < 0.5 && Math.abs(o.dy - t.dy) < 0.5 && Math.abs(o.zoom / this.overlayFocusZoom - 1) < 0.002) {
            o.zoom = this.overlayFocusZoom;
            o.dx = t.dx;
            o.dy = t.dy;
            this.overlayFocusId = null;
          }
          this.clampOverlay();
        }
      }

      if (this.camTarget) {
        if (this.centerLock && this.centerHoldId != null) {
          const hw = this.worldOf(this.centerHoldId);
          if (hw) this.camTarget = this.camCentering(hw, this.camTarget.s);
        }
        const k = 1 - Math.pow(0.001, 16 / 1000) * 0.85;
        this.cam.cx = lerp(this.cam.cx, this.camTarget.cx, k);
        this.cam.cy = lerp(this.cam.cy, this.camTarget.cy, k);
        this.cam.s = this.cam.s * Math.pow(this.camTarget.s / this.cam.s, k);
        if (Math.abs(this.cam.cx - this.camTarget.cx) * this.cam.s < 0.3 && Math.abs(this.cam.cy - this.camTarget.cy) * this.cam.s < 0.3 && Math.abs(this.cam.s / this.camTarget.s - 1) < 0.002) {
          this.cam = { ...this.camTarget };
          this.camTarget = null;
        }
        this.project();
      }

      if (this.travelToId != null && !this.follow) {
        const w = this.worldOf(this.travelToId);
        if (!w || !this.isAlive(this.travelToId)) {
          this.travelToId = null;
          this.meFlight = null;
        } else if (this.meFlight) {
          const fl = this.meFlight;
          const t = Math.min(1, (now - fl.t0) / ME_FLIGHT.ms);
          const e2 = easeInOut(t);
          const q = 1 - e2;
          this.me.x = q * q * fl.ax + 2 * q * e2 * fl.cx + e2 * e2 * fl.bx;
          this.me.y = q * q * fl.ay + 2 * q * e2 * fl.cy + e2 * e2 * fl.by;
          if (t >= 1) {
            this.me = { x: fl.bx, y: fl.by };
            this.myId = this.travelToId;
            this.travelToId = null;
            this.meFlight = null;
          }
        } else {
          this.me = { ...w };
          this.myId = this.travelToId;
          this.travelToId = null;
        }
      }
      this.stepFollow(now);
    }

    if (this.probe?.exitingAt && now - this.probe.exitingAt > PROBE.exitMs) this.probe = null;

    if (this.probe) this.probe.rings = this.probe.rings.filter((r) => !r.leavingAt || now - r.leavingAt <= PROBE.exitMs);
    if (this.constellation?.exitingAt && now - this.constellation.exitingAt > CONSTELLATION.exitMs) this.constellation = null;
    const probing = !!this.probe && !this.probe.exitingAt;
    const coverTarget = !this.anim && !probing && this.repLayer === this.layer ? 1 : 0;
    const friendTarget = !this.anim && !probing && this.friendsLayer === this.layer ? 1 : 0;
    const fadeK = coverTarget ? 0.045 : 0.16;
    this.coverAlpha += (coverTarget - this.coverAlpha) * fadeK;
    this.friendAlpha += (friendTarget - this.friendAlpha) * (friendTarget ? 0.045 : 0.16);
    if (Math.abs(this.coverAlpha - coverTarget) < 0.005) this.coverAlpha = coverTarget;
    if (Math.abs(this.friendAlpha - friendTarget) < 0.005) this.friendAlpha = friendTarget;

    this.updateReveal();
    this.updateFriends();
    this.spreadExpandedStack();
    if (!this.anim) this.pickRepresentatives();
    this.publish();
  }

  private stepFollow(now: number) {
    const f = this.follow;
    if (!f) return;

    if (!f.driven && !f.mv && !this.anim && now >= f.nextAt) this.stepLeader(now);

    this.trackViewing(f);
    if (!f.mv) return;
    const m = f.mv;
    const at = atArc(m, now);
    const t = at.t;
    this.friendPos.set(f.leader.email, { x: at.x, y: at.y, heading: at.heading });

    const back = t >= 1 ? 1 : Math.max(0, easeInOut(t) - 0.06);
    const qb = 1 - back;
    this.me.x = qb * qb * m.ax + 2 * qb * back * m.cx + back * back * m.bx;
    this.me.y = qb * qb * m.ay + 2 * qb * back * m.cy + back * back * m.by;
    this.project();
    if (t >= 1) {
      f.mv = null;
      f.playingMusicId = m.toId;
      f.leader = { ...f.leader, musicId: m.toId };
      this.myId = m.toId;
    }
  }

  private trackViewing(f: FollowState) {
    const view = this.worldOf(f.viewingMusicId);
    if (!view) return;
    const fr = this.freeRect();

    const targetS = this.entryS * FOLLOW.zoomMul;
    this.cam.s = this.cam.s * Math.pow(targetS / this.cam.s, 0.06);
    this.cam.cx = lerp(this.cam.cx, view.x - (fr.cx - this.W / 2) / this.cam.s, 0.06);
    this.cam.cy = lerp(this.cam.cy, view.y + (fr.cy - this.H / 2) / this.cam.s, 0.06);
    this.project();
  }

  private glideFriend(u: NearbyUser, was: { x: number; y: number; heading: number; mv?: Arc } | undefined, base: { x: number; y: number }, now: number) {
    if (!was) {
      const fresh = { x: base.x, y: base.y, heading: (u.avatarSeed[0] ?? 0.5) * Math.PI * 2 };
      this.friendPos.set(u.email, fresh);
      return fresh;
    }

    const to = was.mv ? { x: was.mv.bx, y: was.mv.by } : was;
    if (Math.hypot(base.x - to.x, base.y - to.y) > FRIEND_MOVE_EPS) {
      was = { ...was, mv: arcBetween(was, base, now, ME_FLIGHT.ms, ME_FLIGHT.bow) };
    }

    if (!was.mv) return was;
    const at = atArc(was.mv, now);
    const next = { x: at.x, y: at.y, heading: at.heading, mv: at.t >= 1 ? undefined : was.mv };
    this.friendPos.set(u.email, next);
    return next;
  }

  private updateFriends() {
    const now = performance.now();
    const f = this.freeRect();
    const G = 58;

    const spreadCells = MAP_FRIENDS_MAX;
    const isLeaderOf = (u: NearbyUser) => this.follow?.leader.email === u.email;

    const hasShip = (u: NearbyUser) => u.riderCount > 0;

    const wasVisible = new Set(this.visFriends.map((v) => v.user.email));
    this.visFriends = [];

    type Cand = { u: NearbyUser; px: number; py: number; heading: number; scale: number };
    const leader: Cand[] = [];
    const cands: Cand[] = [];
    for (const u of this.friends) {
      if (!u.isOnline) continue;
      const isLeader = isLeaderOf(u);
      let w = this.friendPos.get(u.email);

      if (!isLeader) {
        const base = this.anchorFor(u);
        if (!base) continue;
        w = this.glideFriend(u, w, base, now);
      }
      if (!w) continue;

      const { px, py } = this.worldToScreen(w.x, w.y, this.cam, this.parOf(u.musicId));
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      const scale = this.depthScaleOf(u.musicId);
      if (isLeader) {
        leader.push({ u, px, py, heading: w.heading, scale });
        continue;
      }
      if (px < 20 || px > f.x1 - 20 || py < 76 || py > this.H - 104) continue;
      cands.push({ u, px, py, heading: w.heading, scale });
    }

    const order = keptFirst(cands, (c) => wasVisible.has(c.u.email));
    const rect: Rect = { x0: 20, y0: 76, x1: Math.max(21, f.x1 - 20), y1: Math.max(77, this.H - 104) };
    const spread = spreadOrder(order, (i) => ({ x: cands[i].px, y: cands[i].py }), rect, spreadCells);

    const owner = new Map<string, number>();
    const place = (c: Cand, isLeader: boolean) => {
      const cx = Math.floor(c.px / G);
      const cy = Math.floor(c.py / G);
      if (!isLeader) {
        for (let a = -1; a <= 1; a++) {
          for (let b = -1; b <= 1; b++) {
            const at = owner.get(`${cx + a},${cy + b}`);
            if (at != null) {
              const v = this.visFriends[at];

              if (hasShip(c.u) && !v.isLeader && !hasShip(v.user)) {
                const was = v.user;
                v.user = c.u;
                v.px = c.px;
                v.py = c.py;
                v.heading = c.heading;
                v.scale = c.scale;
                v.stacked.unshift(was);
              } else {
                v.stacked.push(c.u);
              }
              return;
            }
          }
        }
      }
      owner.set(`${cx},${cy}`, this.visFriends.length);
      this.visFriends.push({ user: c.u, px: c.px, py: c.py, heading: c.heading, scale: c.scale, isLeader, stacked: [] });
    };

    const byEmail = new Map([...leader, ...cands].map((c) => [c.u.email, c]));

    const ships = new Set(cands.filter((c) => hasShip(c.u)).map((c) => c.u.email));
    const keep = this.cam.s === this.friendPlanScale ? reusablePlan(this.friendPlan, new Set(byEmail.keys()), this.follow?.leader.email ?? null, ships) : null;
    this.friendPlanScale = this.cam.s;

    if (keep) {
      for (const entry of keep) {
        const c = byEmail.get(entry.marker)!;
        this.visFriends.push({
          user: c.u,
          px: c.px,
          py: c.py,
          heading: c.heading,
          scale: c.scale,
          isLeader: isLeaderOf(c.u),
          stacked: entry.stacked.map((e) => byEmail.get(e)!.u),
        });
      }
      return;
    }

    for (const c of leader) place(c, true);
    for (const i of spread) place(cands[i], false);
    this.friendPlan = this.visFriends.map((v) => ({ marker: v.user.email, stacked: v.stacked.map((u) => u.email) }));
  }

  private residentMask(layer = this.layer) {
    const m = new Uint8Array(this.N);
    for (let i = 0; i < this.N; i++) m[i] = this.songs[i].ghostOnly && layer > 0 ? 0 : 1;
    this.keepDemo(m, layer);
    return m;
  }

  residentCount() {
    let n = 0;
    for (let i = 0; i < this.N; i++) n += this.subset[i];
    return n;
  }

  countInView() {
    const f = this.freeRect();
    let n = 0;
    for (let i = 0; i < this.N; i++) {
      if (!this.subset[i]) continue;
      const px = this.pos[i * 2];
      const py = this.pos[i * 2 + 1];
      if (px >= f.x0 && px <= f.x1 && py >= f.y0 && py <= f.y1) n++;
    }
    return n;
  }

  private updateReveal() {
    this.viewportCount = this.countInView();

    this.cloudExtent = this.starRadius();
  }

  private pickRepresentatives() {
    this.visible = [];
    this.chosen = new Set();
    const gw = REPRESENTATIVE_GRID_PX / this.cam.s;
    const occ = new Set<string>();
    const dx = this.dx();
    const dy = this.dy();
    for (const i of this.byWeight) {
      if (!this.subset[i] || this.alpha[i] < 0.5) continue;
      const px = this.pos[i * 2];
      const py = this.pos[i * 2 + 1];
      if (px < -20 || px > this.W + 20 || py < -20 || py > this.H + 20) continue;
      const s = this.songs[i];
      const key = `${Math.floor(s.pc[dx] / gw)},${Math.floor(s.pc[dy] / gw)}`;
      if (occ.has(key)) continue;
      occ.add(key);
      this.chosen.add(i);
      this.visible.push({ i, px, py, r: 15 });
    }

    const extra = new Set<number>();
    if (this.selectedId != null) extra.add(this.selectedId);
    if (this.constellation) for (const id of this.constellation.ids) extra.add(id);
    if (this.probe) for (const id of this.probeIdSet(true)!) extra.add(id);
    for (const id of extra) {
      const i = this.index.get(id);
      if (i == null) continue;

      const pp = this.probePos(id) ?? this.constellationPos(id);
      if (!pp && !this.subset[i]) continue;
      if (pp) {
        const k = this.visible.findIndex((v) => v.i === i);
        if (k >= 0) this.visible.splice(k, 1);

        this.visible.push({ i, px: pp.x, py: pp.y, r: 16 });
        continue;
      }
      if (this.chosen.has(i)) continue;
      this.visible.push({ i, px: this.pos[i * 2], py: this.pos[i * 2 + 1], r: 14 });
    }
  }

  private publish() {
    const snap: Partial<EngineSnapshot> = {
      layer: this.layer,

      boxes: this.boxes,
      residentCount: this.residentCount(),
      viewportCount: this.viewportCount,
      zoomK: Math.round(this.zoomK() * 100) / 100,
      gateProgress: this.gateProgress(),
      gateAtCount: Math.round(this.gateMaxInView()),
      gateOpen: !this.anim && !this.pending && this.gateOpen(),
      atBottom: this.layer >= LAYER_COUNT - 1,
      canRise: this.stack.length > 0,
      pressure: Math.round(this.pressure * 100) / 100,
      pressureDir: this.pressure > 0.01 ? this.pressureDir : 0,

      prefetchBoxes: this.prefetch,
      morph: this.anim
        ? { big: this.anim.big }
        : this.pending
          ? { big: `${LAYER_NAMES[this.layer + 1]} 불러오는 중` }
          : null,
      myMusicId: this.myId,

      home: this.home,
      ghostMusicId: this.ghost?.musicId ?? null,
      playingElsewhere: this.playingElsewhere(),
      canGoHome: this.canGoHome(),
      homeTraveling: this.homeTraveling,
    };
    const changed = (Object.keys(snap) as (keyof EngineSnapshot)[]).some((k) => {
      const a = snap[k];
      const b = this.lastSnap[k];
      if (k === "morph") return (a as { big: string } | null)?.big !== (b as { big: string } | null)?.big;
      return a !== b;
    });
    if (changed) {
      this.lastSnap = { ...this.lastSnap, ...snap };
      this.snapListener?.({ ...snap, camera: { ...this.cam } });
    }
  }
}
