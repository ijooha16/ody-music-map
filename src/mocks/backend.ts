import { DEMO_TOKEN } from "@/constants/public-demo";
import type {
  BackendLikedPlaylistSummary,
  BackendMusicDetail,
  BackendMusicLikeResponse,
  BackendPlaylistDetailResponse,
  BackendPlaylistLikeResponse,
  BackendPlaylistSummary,
  BackendUserDetail,
} from "@/lib/backend";
import type { BackendArtworkDetail, BackendArtworkRound, BackendArtworkSummary, BackendArtworkTrack, BackendDrawResponse } from "@/lib/contest-bff";
import { PC_DIMS } from "@/types";
import type {
  ContestTemplate,
  DisbandResponse,
  DismountResponse,
  FollowListResponse,
  FollowResponse,
  FollowUserSummary,
  LayerUsersSnapshot,
  MapPoint,
  NearbyPerson,
  NearbySnapshot,
  PlayResponse,
  RideResponse,
  TasteAnalysis,
  TasteAxisLabel,
  TasteAxisStatistics,
  TasteFinding,
  TasteReport,
  ViewportMusicGroup,
} from "@/types";
import { mockMusic } from "./music";
import { seeded } from "./seed";
import { allSongs, nearestSongs, songById } from "./songs";

export const DEMO_EMAIL = "demo@ody.app";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const LAYERS = PC_DIMS / 2;
const VOTE_LIMIT = 3;
const SCORING_MS = 6_000;
const FOLLOW_PAGE = 20;
const TASTE_MIN = 10;
const TASTE_STANDARD = 30;
const IMAGE_MAX = 2 * 1024 * 1024;

interface MockUser {
  email: string;
  name: string;
  nickname: string;
  imageUrl: string | null;
  createdAt: string;
  lastSeenMs: number;
  online: boolean;
  played: number;
  discovered: number;
  riders: number;
  tutorialCompleted: boolean;
}

interface MockPlaylist {
  id: number;
  name: string;
  owner: string;
  musicIds: number[];
  likedBy: Map<string, string>;
  baseLikes: number;
  createdAt: string;
}

interface MockArtwork {
  id: number;
  owner: string;
  title: string;
  playlistId: number;
  closed: boolean;
  tracks: BackendArtworkTrack[];
  createdMs: number;
  score: number;
  comment: string;
  baseLikes: number;
}

interface MockState {
  users: Map<string, MockUser>;
  follows: Set<string>;
  likes: Map<string, Map<number, string>>;
  playlists: Map<number, MockPlaylist>;
  nextPlaylistId: number;
  artworks: Map<number, MockArtwork>;
  nextArtworkId: number;
  artworkLikes: Set<string>;
  lastPlayed: Map<string, number>;
  plays: Map<string, number>;
  reports: Map<string, number>;
  nextPlayId: number;
  nextReportId: number;
  taste: Map<string, { report: TasteReport; likedKey: string }>;
  riding: Map<string, string>;
}

const PEOPLE: (Omit<MockUser, "createdAt" | "lastSeenMs" | "imageUrl" | "tutorialCompleted"> & { joinedDays: number; seenHoursAgo: number })[] = [
  { email: "luna@ody.app", name: "김하린", nickname: "루나", online: true, joinedDays: 142, seenHoursAgo: 0, played: 1840, discovered: 212, riders: 2 },
  { email: "nova@ody.app", name: "박도윤", nickname: "노바", online: false, joinedDays: 118, seenHoursAgo: 5, played: 1322, discovered: 164, riders: 0 },
  { email: "dawn3am@ody.app", name: "이서연", nickname: "새벽세시", online: true, joinedDays: 96, seenHoursAgo: 0, played: 977, discovered: 88, riders: 0 },
  { email: "jiho@ody.app", name: "정지호", nickname: "지호의 플리", online: true, joinedDays: 87, seenHoursAgo: 0, played: 2105, discovered: 251, riders: 3 },
  { email: "yunseul@ody.app", name: "최윤슬", nickname: "윤슬", online: true, joinedDays: 64, seenHoursAgo: 0, played: 640, discovered: 73, riders: 1 },
  { email: "nightwalk@ody.app", name: "한민재", nickname: "밤산책", online: false, joinedDays: 51, seenHoursAgo: 26, played: 412, discovered: 39, riders: 0 },
  { email: "whale@ody.app", name: "오수아", nickname: "고래자리", online: true, joinedDays: 33, seenHoursAgo: 0, played: 288, discovered: 31, riders: 0 },
  { email: "skytape@ody.app", name: "윤태오", nickname: "하늘색테이프", online: false, joinedDays: 12, seenHoursAgo: 72, played: 97, discovered: 12, riders: 0 },
];

const FOLLOWS: [string, string][] = [
  [DEMO_EMAIL, "luna@ody.app"],
  [DEMO_EMAIL, "dawn3am@ody.app"],
  [DEMO_EMAIL, "jiho@ody.app"],
  [DEMO_EMAIL, "yunseul@ody.app"],
  ["luna@ody.app", DEMO_EMAIL],
  ["nova@ody.app", DEMO_EMAIL],
  ["jiho@ody.app", DEMO_EMAIL],
  ["nightwalk@ody.app", DEMO_EMAIL],
  ["whale@ody.app", DEMO_EMAIL],
  ["luna@ody.app", "nova@ody.app"],
  ["luna@ody.app", "jiho@ody.app"],
  ["nova@ody.app", "luna@ody.app"],
  ["nova@ody.app", "skytape@ody.app"],
  ["dawn3am@ody.app", "luna@ody.app"],
  ["dawn3am@ody.app", "yunseul@ody.app"],
  ["jiho@ody.app", "luna@ody.app"],
  ["jiho@ody.app", "whale@ody.app"],
  ["yunseul@ody.app", "dawn3am@ody.app"],
  ["nightwalk@ody.app", "luna@ody.app"],
  ["whale@ody.app", "jiho@ody.app"],
  ["skytape@ody.app", "luna@ody.app"],
  ["skytape@ody.app", "nova@ody.app"],
];

const PLAYLISTS: { name: string; owner: string; size: number; likes: number; likedByDemo?: boolean }[] = [
  { name: "새벽 드라이브", owner: "luna@ody.app", size: 14, likes: 38, likedByDemo: true },
  { name: "집중용", owner: "nova@ody.app", size: 12, likes: 21 },
  { name: "비 오는 날", owner: "dawn3am@ody.app", size: 10, likes: 17, likedByDemo: true },
  { name: "출근길 부스터", owner: "jiho@ody.app", size: 16, likes: 44 },
  { name: "잠들기 전에", owner: "yunseul@ody.app", size: 9, likes: 12 },
  { name: "여름밤 산책", owner: "nightwalk@ody.app", size: 11, likes: 8 },
  { name: "내가 찾은 별들", owner: DEMO_EMAIL, size: 12, likes: 3 },
  { name: "주말 오후", owner: DEMO_EMAIL, size: 8, likes: 1 },
];

const TEMPLATES: (ContestTemplate & { shape: { x: number; y: number }[]; closed: boolean })[] = [
  { name: "star", label: "별", pointCount: 5, closed: true, shape: starShape() },
  {
    name: "heart",
    label: "하트",
    pointCount: 8,
    closed: true,
    shape: [
      { x: 0.5, y: 0.32 },
      { x: 0.66, y: 0.2 },
      { x: 0.84, y: 0.28 },
      { x: 0.84, y: 0.48 },
      { x: 0.5, y: 0.84 },
      { x: 0.16, y: 0.48 },
      { x: 0.16, y: 0.28 },
      { x: 0.34, y: 0.2 },
    ],
  },
  {
    name: "big-dipper",
    label: "북두칠성",
    pointCount: 7,
    closed: false,
    shape: [
      { x: 0.08, y: 0.35 },
      { x: 0.24, y: 0.3 },
      { x: 0.38, y: 0.38 },
      { x: 0.5, y: 0.48 },
      { x: 0.56, y: 0.68 },
      { x: 0.82, y: 0.72 },
      { x: 0.86, y: 0.5 },
    ],
  },
  {
    name: "cassiopeia",
    label: "카시오페이아",
    pointCount: 5,
    closed: false,
    shape: [
      { x: 0.08, y: 0.3 },
      { x: 0.3, y: 0.7 },
      { x: 0.5, y: 0.42 },
      { x: 0.7, y: 0.72 },
      { x: 0.92, y: 0.32 },
    ],
  },
  {
    name: "diamond",
    label: "다이아몬드",
    pointCount: 4,
    closed: true,
    shape: [
      { x: 0.5, y: 0.1 },
      { x: 0.85, y: 0.5 },
      { x: 0.5, y: 0.9 },
      { x: 0.15, y: 0.5 },
    ],
  },
  {
    name: "note",
    label: "음표",
    pointCount: 6,
    closed: false,
    shape: [
      { x: 0.3, y: 0.8 },
      { x: 0.42, y: 0.72 },
      { x: 0.42, y: 0.2 },
      { x: 0.75, y: 0.12 },
      { x: 0.75, y: 0.62 },
      { x: 0.63, y: 0.7 },
    ],
  },
];

const ARTWORKS: { owner: string; title: string; template: string; likes: number; hoursAgo: number; likedByDemo?: boolean }[] = [
  { owner: "yunseul@ody.app", title: "윤슬 위의 별", template: "star", likes: 21, hoursAgo: 50, likedByDemo: true },
  { owner: "luna@ody.app", title: "새벽의 북두칠성", template: "big-dipper", likes: 14, hoursAgo: 70 },
  { owner: "nova@ody.app", title: "음표 하나", template: "note", likes: 11, hoursAgo: 30 },
  { owner: "jiho@ody.app", title: "출근길 하트", template: "heart", likes: 9, hoursAgo: 20 },
  { owner: "dawn3am@ody.app", title: "W를 그리는 밤", template: "cassiopeia", likes: 6, hoursAgo: 12 },
  { owner: "whale@ody.app", title: "고래의 지느러미", template: "diamond", likes: 4, hoursAgo: 6 },
  { owner: DEMO_EMAIL, title: "첫 별자리", template: "diamond", likes: 2, hoursAgo: 40 },
];

const AI_COMMENTS = [
  "선이 또렷하게 살아 있어요. 별 사이 간격도 고르게 맞췄어요.",
  "모양이 한눈에 들어와요. 끝점이 조금 흔들린 게 아쉬워요.",
  "곡들이 그림을 잘 따라갔어요. 분위기도 한 갈래로 모였어요.",
  "윤곽은 분명한데 한쪽이 살짝 눌렸어요.",
  "작은 별자리지만 균형이 좋아요.",
];

const AXES: Omit<TasteAxisLabel, "status" | "strength" | "evidence">[] = [
  { axis: "에너지", low: "잔잔한", high: "강렬한", lowTag: "잔잔한 곡", highTag: "에너지 넘치는 곡" },
  { axis: "분위기", low: "어두운", high: "밝은", lowTag: "어두운 무드", highTag: "밝은 무드" },
  { axis: "리듬", low: "느슨한 박자", high: "촘촘한 박자", lowTag: "느린 템포", highTag: "촘촘한 박자" },
  { axis: "질감", low: "어쿠스틱", high: "전자음", lowTag: "어쿠스틱 사운드", highTag: "신스 사운드" },
  { axis: "보컬", low: "연주 중심", high: "보컬 중심", lowTag: "연주곡", highTag: "보컬 중심" },
  { axis: "시대", low: "옛날 감성", high: "요즘 사운드", lowTag: "레트로 감성", highTag: "요즘 사운드" },
];
const EXPLAINED = [0.21, 0.14, 0.11, 0.08, 0.06, 0.05];

function starShape(): { x: number; y: number }[] {
  return [0, 2, 4, 1, 3].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return { x: 0.5 + Math.cos(a) * 0.42, y: 0.52 + Math.sin(a) * 0.42 };
  });
}

const iso = (ms: number) => new Date(ms).toISOString();
const r3 = (v: number) => Math.round(v * 1000) / 1000;

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0;
  return h;
}

let poolCache: MapPoint[] | null = null;
function pool(): MapPoint[] {
  poolCache ??= allSongs().filter((s) => s.playable && !s.ghostOnly);
  return poolCache;
}

function clusterAround(seed: number, size: number): number[] {
  const list = pool();
  const anchor = list[Math.floor(seeded(seed)() * list.length)];
  return [anchor, ...nearestSongs(anchor, size * 3).filter((s) => s.playable && !s.ghostOnly)]
    .filter((_, i) => i % 2 === 0)
    .slice(0, size)
    .map((s) => s.musicId);
}

function traceShape(shape: readonly { x: number; y: number }[], seed: number): { tracks: BackendArtworkTrack[]; fitError: number } {
  const rand = seeded(seed);
  const span = 1.5;
  const cx = (rand() - 0.5) * 1.4;
  const cy = (rand() - 0.5) * 0.9;
  const used = new Set<number>();
  let total = 0;
  const tracks = shape.map((p) => {
    const tx = cx + (p.x - 0.5) * span;
    const ty = cy - (p.y - 0.5) * span;
    let best = pool()[0];
    let bestD = Infinity;
    for (const s of pool()) {
      if (used.has(s.musicId)) continue;
      const d = Math.hypot(s.pc[0] - tx, s.pc[1] - ty);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    used.add(best.musicId);
    total += bestD;
    return { musicId: best.musicId, title: best.title, artist: best.artist, x: best.pc[0], y: best.pc[1] };
  });
  return { tracks, fitError: Math.min(1, (total / Math.max(1, shape.length) / span) * 5) };
}

function seedState(): MockState {
  const now = Date.now();
  const users = new Map<string, MockUser>();
  const demo: MockUser = {
    email: DEMO_EMAIL,
    name: "데모",
    nickname: "데모 탐험가",
    imageUrl: null,
    createdAt: iso(now - 21 * DAY),
    lastSeenMs: now,
    online: true,
    played: 128,
    discovered: 23,
    riders: 0,
    tutorialCompleted: true,
  };
  users.set(demo.email, demo);
  for (const p of PEOPLE) {
    users.set(p.email, {
      email: p.email,
      name: p.name,
      nickname: p.nickname,
      imageUrl: null,
      createdAt: iso(now - p.joinedDays * DAY),
      lastSeenMs: now - p.seenHoursAgo * HOUR,
      online: p.online,
      played: p.played,
      discovered: p.discovered,
      riders: p.riders,
      tutorialCompleted: true,
    });
  }

  const s: MockState = {
    users,
    follows: new Set(FOLLOWS.map(([a, b]) => `${a}>${b}`)),
    likes: new Map(),
    playlists: new Map(),
    nextPlaylistId: 1,
    artworks: new Map(),
    nextArtworkId: 1,
    artworkLikes: new Set(),
    lastPlayed: new Map(),
    plays: new Map(),
    reports: new Map(),
    nextPlayId: 1,
    nextReportId: 1,
    taste: new Map(),
    riding: new Map(),
  };

  PLAYLISTS.forEach((p, i) => {
    const created = addPlaylist(s, p.owner, p.name, clusterAround(7001 + i * 31, p.size), now - (40 - i * 4) * DAY);
    created.baseLikes = p.likes;
    if (p.likedByDemo) created.likedBy.set(DEMO_EMAIL, iso(now - (i + 2) * DAY));
  });

  const liked = new Map<number, string>();
  [...clusterAround(9101, 8), ...clusterAround(9377, 6)].forEach((id, i) => liked.set(id, iso(now - (i + 1) * 9 * HOUR)));
  s.likes.set(DEMO_EMAIL, liked);

  ARTWORKS.forEach((a, i) => {
    const template = TEMPLATES.find((t) => t.name === a.template) ?? TEMPLATES[0];
    const { tracks, fitError } = traceShape(template.shape, 5101 + i * 53);
    const playlist = addPlaylist(s, a.owner, a.title, tracks.map((t) => t.musicId), now - a.hoursAgo * HOUR);
    const id = s.nextArtworkId++;
    s.artworks.set(id, {
      id,
      owner: a.owner,
      title: a.title,
      playlistId: playlist.id,
      closed: template.closed,
      tracks,
      createdMs: now - a.hoursAgo * HOUR,
      score: Math.round((1 - fitError) * 100) - (i % 3) * 4,
      comment: AI_COMMENTS[i % AI_COMMENTS.length],
      baseLikes: a.likes,
    });
    if (a.likedByDemo) s.artworkLikes.add(`${DEMO_EMAIL}>${id}`);
  });

  return s;
}

function addPlaylist(s: MockState, owner: string, name: string, musicIds: number[], createdMs = Date.now()): MockPlaylist {
  const p: MockPlaylist = { id: s.nextPlaylistId++, name, owner, musicIds: [...new Set(musicIds)], likedBy: new Map(), baseLikes: 0, createdAt: iso(createdMs) };
  s.playlists.set(p.id, p);
  return p;
}

const STATE_KEY = "__odyMockBackend";

function state(): MockState {
  const g = globalThis as typeof globalThis & { [STATE_KEY]?: MockState };
  g[STATE_KEY] ??= seedState();
  return g[STATE_KEY];
}

function done(data: unknown, status = 200): Response {
  return Response.json({ success: true, data, error: null }, { status });
}

function fail(status: number, code: string, message: string): Response {
  return Response.json({ success: false, data: null, error: { code, message } }, { status });
}

function emailOf(authorization: string | null): string | null {
  const payload = authorization?.replace(/^Bearer\s+/i, "").split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

function ensureUser(email: string): MockUser {
  const s = state();
  const found = s.users.get(email);
  if (found) return found;
  const nick = email.split("@")[0];
  const user: MockUser = {
    email,
    name: nick,
    nickname: nick,
    imageUrl: null,
    createdAt: iso(Date.now()),
    lastSeenMs: Date.now(),
    online: true,
    played: 0,
    discovered: 0,
    riders: 0,
    tutorialCompleted: true,
  };
  s.users.set(email, user);
  return user;
}

function likesOf(email: string): Map<number, string> {
  const s = state();
  let m = s.likes.get(email);
  if (!m) {
    m = new Map();
    s.likes.set(email, m);
  }
  return m;
}

export function isMockLiked(email: string | null, musicId: number): boolean {
  return likesOf(email ?? DEMO_EMAIL).has(musicId);
}

const follows = (a: string, b: string) => state().follows.has(`${a}>${b}`);
const followersOf = (email: string) => [...state().follows].filter((e) => e.endsWith(`>${email}`)).map((e) => e.slice(0, e.indexOf(">")));
const followingOf = (email: string) => [...state().follows].filter((e) => e.startsWith(`${email}>`)).map((e) => e.slice(e.indexOf(">") + 1));

function userDetail(u: MockUser, me: string): BackendUserDetail {
  const s = state();
  return {
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    tutorialCompleted: u.tutorialCompleted,
    lastActiveAt: iso(u.online ? Date.now() : u.lastSeenMs),
    createdAt: u.createdAt,
    imageUrl: u.imageUrl,
    followerCnt: followersOf(u.email).length,
    followingCnt: followingOf(u.email).length,
    isFollowing: follows(me, u.email),
    isMe: u.email === me,
    playedMusicCnt: u.played + (s.plays.get(u.email) ?? 0),
    discoveredMusicCnt: u.discovered,
    isOnline: u.online,
    isBot: false,
  };
}

function followSummary(u: MockUser, me: string): FollowUserSummary {
  return {
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    imageUrl: u.imageUrl,
    isFollowing: follows(me, u.email),
    lastActiveAt: iso(u.online ? Date.now() : u.lastSeenMs),
    isOnline: u.online,
    meetingCnt: hash(`${me}|${u.email}`) % 9,
  };
}

function backendMusic(id: number): BackendMusicDetail {
  const m = mockMusic(id);
  return {
    id,
    mbid: m.mbid,
    title: m.title,
    artist: m.artist,
    album: m.album,
    youtubeUrl: m.youtubeUrl,
    albumMbid: null,
    albumCoverUrl: m.albumCoverUrl,
    location: m.location ? Object.fromEntries(m.location.map((v, i) => [`pc${i + 1}`, v])) : null,
    bpm: m.bpm,
    duration: m.duration,
    releaseYear: m.releaseYear,
    playCnt: m.playCnt,
    youtubeCnt: m.youtubeCnt,
  };
}

function playlistOf(id: number): MockPlaylist | null {
  return Number.isInteger(id) ? (state().playlists.get(id) ?? null) : null;
}

const likeCount = (p: MockPlaylist) => p.baseLikes + p.likedBy.size;

function playlistDetail(p: MockPlaylist, me: string): BackendPlaylistDetailResponse {
  const musics = p.musicIds.map(backendMusic);
  return {
    playlistId: p.id,
    playlistName: p.name,
    musicCnt: musics.length,
    totalDuration: musics.reduce((sum, m) => sum + (m.duration ?? 0), 0),
    likeCnt: likeCount(p),
    isLiked: p.likedBy.has(me),
    musics,
  };
}

function uniqueName(owner: string, base: string): string {
  const taken = new Set([...state().playlists.values()].filter((p) => p.owner === owner).map((p) => p.name));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base} ${n}`)) return `${base} ${n}`;
}

const songIds = (raw: unknown): number[] => (Array.isArray(raw) ? raw.map(Number).filter((n) => Number.isInteger(n) && songById(n)) : []);

function layerOf(raw: unknown): number {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(LAYERS - 1, Math.max(0, n)) : 0;
}

function pointIn(musicId: number, layer: number): { x: number; y: number } {
  const s = songById(musicId);
  return { x: s?.pc[layer * 2] ?? 0, y: s?.pc[layer * 2 + 1] ?? 0 };
}

function nearbyIn(musicId: number, layer: number, count: number): MapPoint[] {
  const center = pointIn(musicId, layer);
  return pool()
    .filter((s) => s.musicId !== musicId)
    .map((s) => ({ s, d: Math.hypot(s.pc[layer * 2] - center.x, s.pc[layer * 2 + 1] - center.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.s);
}

function whereIs(email: string, me: string, layer: number): number {
  const bucket = Math.floor(Date.now() / (2 * MIN));
  const rand = seeded(hash(`${email}|${bucket}`));
  const anchor = state().lastPlayed.get(me);
  const online = [...state().users.values()].filter((u) => u.online && u.email !== me);
  const order = online.findIndex((u) => u.email === email);
  if (anchor != null && order >= 0 && order < 3) {
    const near = nearbyIn(anchor, layer, 24);
    return near[Math.floor(rand() * near.length)].musicId;
  }
  const list = pool();
  return list[Math.floor(rand() * list.length)].musicId;
}

function onlineOthers(me: string): MockUser[] {
  return [...state().users.values()].filter((u) => u.online && u.email !== me);
}

function riding(me: string): MockUser | null {
  const captain = state().riding.get(me);
  return captain ? (state().users.get(captain) ?? null) : null;
}

function riderCount(u: MockUser): number {
  return u.riders + [...state().riding.values()].filter((c) => c === u.email).length;
}

function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const a = Math.floor(i);
  const b = Math.ceil(i);
  return sorted[a] + (sorted[b] - sorted[a]) * (i - a);
}

let dimsCache: number[][] | null = null;
function percentileOf(dim: number, v: number): number {
  dimsCache ??= Array.from({ length: PC_DIMS }, (_, d) => allSongs().map((s) => s.pc[d]).sort((a, b) => a - b));
  const arr = dimsCache[dim];
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo / arr.length;
}

function axisStats(points: MapPoint[]): TasteAxisStatistics[] {
  return AXES.map((label, d) => {
    const raw = points.map((p) => p.pc[d]).sort((a, b) => a - b);
    const q = { min: raw[0] ?? 0, q1: quantile(raw, 0.25), median: quantile(raw, 0.5), q3: quantile(raw, 0.75), max: raw[raw.length - 1] ?? 0 };
    const pct = {
      min: percentileOf(d, q.min),
      q1: percentileOf(d, q.q1),
      median: percentileOf(d, q.median),
      q3: percentileOf(d, q.q3),
      max: percentileOf(d, q.max),
    };
    const histogram = Array.from({ length: 10 }, () => 0);
    for (const v of raw) histogram[Math.min(9, Math.floor(percentileOf(d, v) * 10))] += 1;
    return {
      pc: d + 1,
      raw: { min: r3(q.min), q1: r3(q.q1), median: r3(q.median), q3: r3(q.q3), max: r3(q.max) },
      percentile: { min: r3(pct.min), q1: r3(pct.q1), median: r3(pct.median), q3: r3(pct.q3), max: r3(pct.max), iqr: r3(pct.q3 - pct.q1) },
      histogram,
      explainedVariance: EXPLAINED[d],
      label: { ...label, status: "LABELED", strength: d < 3 ? "STRONG" : "MODERATE", evidence: `상위 ${Math.round(EXPLAINED[d] * 100)}% 분산을 설명하는 축` },
    };
  });
}

function findingsOf(axes: TasteAxisStatistics[]): TasteFinding[] {
  const out: TasteFinding[] = [];
  for (const a of axes) {
    const med = a.percentile.median;
    const iqr = a.percentile.iqr;
    const pct = Math.round(med * 100);
    if (iqr > 0.55) {
      out.push({ id: `pc${a.pc}-both`, type: "DIVERSE", pc: a.pc, direction: "BOTH", effectSize: r3(iqr), evidence: `사분범위 ${Math.round(iqr * 100)}%p`, axisPhrase: `${a.label.low} / ${a.label.high}` });
    } else if (med >= 0.62 || med <= 0.38) {
      const high = med >= 0.62;
      out.push({
        id: `pc${a.pc}-${high ? "high" : "low"}`,
        type: iqr < 0.3 ? "CONSISTENT_BIAS" : "BIAS",
        pc: a.pc,
        direction: high ? "HIGH" : "LOW",
        effectSize: r3(Math.abs(med - 0.5) * 2),
        evidence: `중앙값 백분위 ${pct}`,
        axisPhrase: high ? a.label.high : a.label.low,
      });
    }
  }
  out.sort((a, b) => b.effectSize - a.effectSize);
  const top = out.slice(0, 3);
  if (top.length === 0) top.push({ id: "center", type: "BALANCED", pc: null, direction: "CENTER", effectSize: 0, evidence: "모든 축의 중앙값이 가운데", axisPhrase: "고른 취향" });
  return top;
}

function narrativeOf(f: TasteFinding, axes: TasteAxisStatistics[]): string {
  const label = axes.find((a) => a.pc === f.pc)?.label;
  if (f.type === "CONSISTENT_BIAS") return `좋아요한 곡 대부분이 ${f.axisPhrase} 쪽에 모여 있어요.`;
  if (f.type === "BIAS") return `${f.axisPhrase} 쪽으로 기울어 있지만 반대편 곡도 종종 골라요.`;
  if (f.type === "DIVERSE") return `${label?.axis ?? "이"} 축에서는 ${label?.low ?? ""}부터 ${label?.high ?? ""}까지 폭넓게 들어요.`;
  return "어느 한쪽으로 튀지 않고 고르게 들어요.";
}

function summaryOf(findings: TasteFinding[], axes: TasteAxisStatistics[]): string {
  const [first, second] = findings;
  if (first.direction === "CENTER") return "어느 쪽에도 치우치지 않는 고른 귀를 가졌어요";
  if (first.direction === "BOTH") return `${axes.find((a) => a.pc === first.pc)?.label.axis ?? "소리"}만큼은 양 끝을 넘나들며 들어요`;
  if (second && second.direction !== "CENTER" && second.direction !== "BOTH") return `${first.axisPhrase} 결에 ${second.axisPhrase} 색을 더한 곡을 자주 골라요`;
  return `${first.axisPhrase} 쪽 소리에 자주 손이 가요`;
}

function tasteOf(me: string, generate: boolean): TasteAnalysis | Response {
  const s = state();
  const liked = [...likesOf(me).keys()];
  const points = liked.map((id) => songById(id)).filter((p): p is MapPoint => !!p);
  const valid = points.length;
  const likedKey = liked.slice().sort((a, b) => a - b).join(",");
  const eligible = valid >= TASTE_MIN;
  const level = !eligible ? null : valid >= TASTE_STANDARD ? "STANDARD" : "INITIAL";
  if (generate && !eligible) return fail(422, "TASTE_INSUFFICIENT_SAMPLE", `좋아요한 곡이 ${TASTE_MIN}곡 이상이어야 리포트를 만들 수 있어요.`);

  const axes = axisStats(points);
  if (generate && level) {
    const findings = findingsOf(axes);
    const now = iso(Date.now());
    s.taste.set(me, {
      likedKey,
      report: {
        level,
        aiGenerated: true,
        fresh: true,
        summary: summaryOf(findings, axes),
        narratives: findings.map((f) => ({ findingId: f.id, text: narrativeOf(f, axes), evidence: f.evidence })),
        findings,
        analyzedAt: now,
        generatedAt: now,
        lastRefreshedAt: now,
      },
    });
  }

  const saved = s.taste.get(me);
  const fresh = !!saved && saved.likedKey === likedKey;
  return {
    state: valid === 0 ? "EMPTY" : !eligible ? "DISTRIBUTION_ONLY" : saved ? (fresh ? "FRESH" : "STALE") : "READY",
    counts: { totalLiked: liked.length, valid, excluded: liked.length - valid, exclusions: {} },
    reportEligibility: { eligible, level, additionalLikesNeeded: Math.max(0, TASTE_MIN - valid) },
    analysisVersion: "demo-1",
    axes,
    points: points.map((p) => ({ musicId: p.musicId, title: p.title, artist: p.artist, coordinates: p.pc.slice(0, AXES.length) })),
    report: saved ? { ...saved.report, fresh } : null,
    generation: {
      status: saved ? "GENERATED" : eligible ? "NOT_REQUESTED" : "INELIGIBLE",
      generatedThisRequest: generate,
      dailyLimitUsedToday: false,
      canRetry: false,
      failureCode: null,
      nextAvailableAt: null,
    },
  };
}

function tasteResponse(me: string, generate: boolean): Response {
  const res = tasteOf(me, generate);
  return res instanceof Response ? res : done(res);
}

function weekRange(): { start: number; end: number } {
  const kst = 9 * HOUR;
  const now = Date.now() + kst;
  const day = new Date(now).getUTCDay();
  const midnight = now - (now % DAY);
  const start = midnight - ((day + 6) % 7) * DAY - kst;
  return { start, end: start + 7 * DAY };
}

function round(me: string): BackendArtworkRound {
  const { start, end } = weekRange();
  const used = [...state().artworkLikes].filter((k) => k.startsWith(`${me}>`)).length;
  return { roundId: 1, theme: "가을밤 별자리", startsAt: iso(start), endsAt: iso(end), voteLimit: VOTE_LIMIT, myVotesLeft: Math.max(0, VOTE_LIMIT - used) };
}

const artworkLikes = (a: MockArtwork) => a.baseLikes + [...state().artworkLikes].filter((k) => k.endsWith(`>${a.id}`)).length;
const scored = (a: MockArtwork) => Date.now() - a.createdMs >= SCORING_MS;

function rankedArtworks(): { a: MockArtwork; rank: number | null; rankScore: number | null }[] {
  const list = [...state().artworks.values()];
  const ranked = list
    .filter(scored)
    .map((a) => ({ a, rankScore: Math.round((a.score + artworkLikes(a) * 2) * 10) / 10 }))
    .sort((x, y) => y.rankScore - x.rankScore)
    .map((x, i) => ({ ...x, rank: i + 1 }));
  const pending = list.filter((a) => !scored(a)).map((a) => ({ a, rank: null, rankScore: null }));
  return [...ranked, ...pending];
}

function artworkSummary(a: MockArtwork, rank: number | null, rankScore: number | null, me: string): BackendArtworkSummary {
  const ok = scored(a);
  return {
    artworkId: a.id,
    rank,
    title: a.title,
    ownerEmail: a.owner,
    ownerNickname: state().users.get(a.owner)?.nickname ?? null,
    status: ok ? "SCORED" : "PENDING",
    score: ok ? a.score : null,
    aiComment: ok ? a.comment : null,
    failReason: null,
    likeCnt: artworkLikes(a),
    likedByMe: state().artworkLikes.has(`${me}>${a.id}`),
    musicCnt: a.tracks.length,
    createdAt: iso(a.createdMs),
    rankScore,
    closed: a.closed,
    points: a.tracks,
    playlistId: a.playlistId,
  };
}

function tracksOf(musicIds: number[]): BackendArtworkTrack[] {
  return musicIds.map((id) => {
    const s = songById(id);
    return { musicId: id, title: s?.title ?? null, artist: s?.artist ?? null, x: s?.pc[0] ?? 0, y: s?.pc[1] ?? 0 };
  });
}

function rankedUsers(metric: (u: MockUser) => number) {
  return [...state().users.values()]
    .map((u) => ({ u, count: metric(u) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((x, i) => ({ rank: i + 1, email: x.u.email, nickname: x.u.nickname, imageUrl: x.u.imageUrl, count: x.count }));
}

interface Ctx {
  me: string;
  q: URLSearchParams;
  body: Record<string, unknown>;
  form: FormData | null;
  m: RegExpMatchArray;
}

type Handler = (c: Ctx) => Response | Promise<Response>;

const HANDLERS: [string, RegExp, Handler][] = [
  ["POST", /^\/api\/auth\/(login|signup|reissue)$/, () => done({ accessToken: DEMO_TOKEN })],
  [
    "POST",
    /^\/api\/auth\/login\/google$/,
    () => {
      const u = ensureUser(DEMO_EMAIL);
      return done({ accessToken: DEMO_TOKEN, user: { email: u.email, name: u.name, nickname: u.nickname, imageUrl: u.imageUrl } });
    },
  ],
  ["POST", /^\/api\/auth\/(logout|withdraw)$/, () => done(null)],

  [
    "GET",
    /^\/api\/user\/detail$/,
    ({ me, q }) => {
      const email = q.get("email") ?? me;
      const u = email === me ? ensureUser(me) : state().users.get(email);
      return u ? done(userDetail(u, me)) : fail(404, "USER_NOT_FOUND", "없는 사용자입니다.");
    },
  ],
  [
    "PATCH",
    /^\/api\/user\/tutorial-completed$/,
    ({ me }) => {
      ensureUser(me).tutorialCompleted = true;
      return done({ tutorialCompleted: true });
    },
  ],
  [
    "PATCH",
    /^\/api\/user\/nickname$/,
    ({ me, body }) => {
      const nickname = String(body.nickname ?? "").trim();
      const taken = [...state().users.values()].some((u) => u.email !== me && u.nickname.toLowerCase() === nickname.toLowerCase());
      if (taken) return fail(409, "NICKNAME_ALREADY_EXISTS", "이미 쓰이고 있는 닉네임이에요.");
      ensureUser(me).nickname = nickname;
      return done({ nickname });
    },
  ],
  [
    "PATCH",
    /^\/api\/user\/image$/,
    async ({ me, form }) => {
      const file = form?.get("file");
      if (!(file instanceof File)) return fail(400, "VALIDATION_ERROR", "올릴 사진을 골라 주세요.");
      if (file.size > IMAGE_MAX) return fail(413, "FILE_TOO_LARGE", "데모에서는 2MB 이하 사진만 올릴 수 있어요.");
      const imageUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
      ensureUser(me).imageUrl = imageUrl;
      return done({ imageUrl });
    },
  ],
  ["PATCH", /^\/api\/user\/public$/, ({ body }) => done({ isPublic: body.isPublic === true })],
  [
    "GET",
    /^\/api\/users\/nickname-available$/,
    ({ me, q }) => {
      const nickname = (q.get("nickname") ?? "").trim().toLowerCase();
      return done({ available: ![...state().users.values()].some((u) => u.email !== me && u.nickname.toLowerCase() === nickname) });
    },
  ],
  [
    "POST",
    /^\/api\/user\/follow\/(insert|delete)$/,
    ({ me, body, m }) => {
      const target = String(body.followeeEmail ?? "");
      if (target === me) return fail(400, "SELF_FOLLOW_NOT_ALLOWED", "자기 자신은 팔로우할 수 없어요.");
      if (!state().users.has(target)) return fail(404, "USER_NOT_FOUND", "없는 사용자입니다.");
      const key = `${me}>${target}`;
      if (m[1] === "insert") {
        if (state().follows.has(key)) return fail(409, "ALREADY_FOLLOWING", "이미 팔로우하고 있어요.");
        state().follows.add(key);
      } else {
        state().follows.delete(key);
      }
      const res: FollowResponse = { followerEmail: me, followeeEmail: target, isFollowing: m[1] === "insert", followeeFollowerCnt: followersOf(target).length };
      return done(res);
    },
  ],
  [
    "GET",
    /^\/api\/user\/follow\/list$/,
    ({ me, q }) => {
      const email = q.get("email") || me;
      if (!state().users.has(email)) return fail(404, "USER_NOT_FOUND", "없는 사용자입니다.");
      const type = q.get("type") === "following" ? "following" : "follower";
      const page = Math.max(0, Number(q.get("page")) || 0);
      const emails = type === "follower" ? followersOf(email) : followingOf(email);
      const all = emails.map((e) => state().users.get(e)).filter((u): u is MockUser => !!u);
      const res: FollowListResponse = {
        type,
        content: all.slice(page * FOLLOW_PAGE, (page + 1) * FOLLOW_PAGE).map((u) => followSummary(u, me)),
        page,
        size: FOLLOW_PAGE,
        hasNext: (page + 1) * FOLLOW_PAGE < all.length,
      };
      return done(res);
    },
  ],

  [
    "POST",
    /^\/api\/music\/like$/,
    ({ me, body }) => {
      const musicId = Number(body.musicId);
      if (!songById(musicId)) return fail(404, "MUSIC_NOT_FOUND", "없는 곡입니다.");
      const likes = likesOf(me);
      const liked = body.liked === true;
      if (liked && !likes.has(musicId)) likes.set(musicId, iso(Date.now()));
      if (!liked) likes.delete(musicId);
      const res: BackendMusicLikeResponse = { musicId, liked, likedAt: likes.get(musicId) ?? null };
      return done(res);
    },
  ],
  [
    "POST",
    /^\/api\/music\/play$/,
    ({ me, body }) => {
      const s = state();
      const musicId = Number(body.musicId);
      if (!songById(musicId)) return fail(404, "MUSIC_NOT_FOUND", "없는 곡입니다.");
      const layer = layerOf(body.layer);
      const { x, y } = pointIn(musicId, layer);
      s.lastPlayed.set(me, musicId);
      s.plays.set(me, (s.plays.get(me) ?? 0) + 1);
      const res: PlayResponse = { playHistoryId: s.nextPlayId++, musicId, layer, x, y, cellX: Math.floor(x * 4), cellY: Math.floor(y * 4) };
      return done(res);
    },
  ],
  [
    "POST",
    /^\/api\/music\/report$/,
    ({ me }) => {
      const s = state();
      s.reports.set(me, (s.reports.get(me) ?? 0) + 1);
      return done({ reportId: s.nextReportId++ });
    },
  ],

  [
    "GET",
    /^\/api\/playlist\/search$/,
    ({ me, q }) => {
      const email = q.get("email") || me;
      const content: BackendPlaylistSummary[] = [...state().playlists.values()]
        .filter((p) => p.owner === email)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => ({ playlistId: p.id, playlistName: p.name, musicCnt: p.musicIds.length, createdAt: p.createdAt }));
      return done({ content });
    },
  ],
  [
    "GET",
    /^\/api\/playlist\/liked$/,
    ({ me, q }) => {
      const email = q.get("email") || me;
      const content: BackendLikedPlaylistSummary[] = [...state().playlists.values()]
        .filter((p) => p.likedBy.has(email))
        .map((p) => ({
          playlistId: p.id,
          playlistName: p.name,
          musicCnt: p.musicIds.length,
          likeCnt: likeCount(p),
          ownerEmail: p.owner,
          ownerNickname: state().users.get(p.owner)?.nickname ?? null,
          likedAt: p.likedBy.get(email) ?? iso(Date.now()),
        }))
        .sort((a, b) => b.likedAt.localeCompare(a.likedAt));
      return done({ content });
    },
  ],
  [
    "GET",
    /^\/api\/playlist\/detail$/,
    ({ me, q }) => {
      const p = playlistOf(Number(q.get("playlistId")));
      return p ? done(playlistDetail(p, me)) : fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
    },
  ],
  [
    "POST",
    /^\/api\/playlist\/create$/,
    ({ me, body }) => {
      const name = String(body.playlistName ?? "").trim();
      if (!name) return fail(400, "VALIDATION_ERROR", "플레이리스트 이름이 필요합니다.");
      if ([...state().playlists.values()].some((p) => p.owner === me && p.name === name)) return fail(409, "PLAYLIST_NAME_DUPLICATED", "같은 이름의 플레이리스트가 있어요.");
      const p = addPlaylist(state(), me, name, songIds(body.musicIdList));
      return done({ playlistId: p.id, playlistName: p.name, musicCnt: p.musicIds.length });
    },
  ],
  [
    "PATCH",
    /^\/api\/playlist\/update$/,
    ({ me, body }) => {
      const p = playlistOf(Number(body.playlistId));
      if (!p) return fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
      if (p.owner !== me) return fail(403, "FORBIDDEN", "내 플레이리스트만 바꿀 수 있어요.");
      const name = String(body.playlistName ?? "").trim();
      if (name && name !== p.name && [...state().playlists.values()].some((o) => o.owner === me && o.name === name)) {
        return fail(409, "PLAYLIST_NAME_DUPLICATED", "같은 이름의 플레이리스트가 있어요.");
      }
      if (name) p.name = name;
      return done({ playlistId: p.id, playlistName: p.name });
    },
  ],
  [
    "DELETE",
    /^\/api\/playlist\/delete\/(\d+)$/,
    ({ me, m }) => {
      const p = playlistOf(Number(m[1]));
      if (!p) return fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
      if (p.owner !== me) return fail(403, "FORBIDDEN", "내 플레이리스트만 지울 수 있어요.");
      state().playlists.delete(p.id);
      return done(null);
    },
  ],
  [
    "POST",
    /^\/api\/playlist\/music\/(insert|delete|reorder)$/,
    ({ me, body, m }) => {
      const p = playlistOf(Number(body.playlistId));
      if (!p) return fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
      if (p.owner !== me) return fail(403, "FORBIDDEN", "내 플레이리스트만 바꿀 수 있어요.");
      const ids = songIds(body.musicIdList);
      if (m[1] === "insert") {
        const fresh = ids.filter((id) => !p.musicIds.includes(id));
        p.musicIds.push(...fresh);
        return done({ playlistId: p.id, insertedCnt: fresh.length, skippedCnt: ids.length - fresh.length, musicCnt: p.musicIds.length });
      }
      if (m[1] === "delete") {
        const before = p.musicIds.length;
        p.musicIds = p.musicIds.filter((id) => !ids.includes(id));
        return done({ playlistId: p.id, deletedCnt: before - p.musicIds.length, musicCnt: p.musicIds.length });
      }
      p.musicIds = [...ids.filter((id) => p.musicIds.includes(id)), ...p.musicIds.filter((id) => !ids.includes(id))];
      return done({ playlistId: p.id, musicCnt: p.musicIds.length });
    },
  ],
  [
    "POST",
    /^\/api\/playlist\/like$/,
    ({ me, body }) => {
      const p = playlistOf(Number(body.playlistId));
      if (!p) return fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
      if (body.liked === true) {
        if (!p.likedBy.has(me)) p.likedBy.set(me, iso(Date.now()));
      } else {
        p.likedBy.delete(me);
      }
      const res: BackendPlaylistLikeResponse = { playlistId: p.id, liked: p.likedBy.has(me), likeCnt: likeCount(p) };
      return done(res);
    },
  ],

  [
    "POST",
    /^\/api\/constellations\/layout$/,
    ({ body }) => done({ points: songIds(body.musicIds).map((id) => ({ musicId: id, ...pointIn(id, 0) })) }),
  ],

  [
    "GET",
    /^\/api\/realtime\/layers\/([^/]+)\/users$/,
    ({ me, m }) => {
      const layer = Number(m[1]);
      if (!Number.isInteger(layer) || layer < 0 || layer >= LAYERS) return fail(400, "INVALID_INPUT", "레이어가 올바르지 않습니다.");
      const groups = new Map<number, ViewportMusicGroup>();
      for (const u of onlineOthers(me)) {
        const musicId = whereIs(u.email, me, layer);
        const g = groups.get(musicId) ?? { musicId, ...pointIn(musicId, layer), users: [] };
        g.users.push({ email: u.email, nickname: u.nickname, imageUrl: u.imageUrl, riderCount: riderCount(u) });
        groups.set(musicId, g);
      }
      const res: LayerUsersSnapshot = { layer, groups: [...groups.values()] };
      return done(res);
    },
  ],
  [
    "POST",
    /^\/api\/realtime\/nearby$/,
    ({ me }) => {
      const anchor = state().lastPlayed.get(me);
      if (anchor == null) return fail(422, "PRESENCE_ERROR", "곡을 먼저 재생해 주세요.");
      const center = pointIn(anchor, 0);
      const people: NearbyPerson[] = onlineOthers(me)
        .map((u) => {
          const musicId = whereIs(u.email, me, 0);
          const at = pointIn(musicId, 0);
          return {
            email: u.email,
            nickname: u.nickname,
            imageUrl: u.imageUrl,
            meetingCount: hash(`${me}|${u.email}`) % 9,
            riderCount: riderCount(u),
            musicId,
            x: at.x,
            y: at.y,
            distance: r3(Math.hypot(at.x - center.x, at.y - center.y)),
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      const res: NearbySnapshot = { anchorMusicId: anchor, snapshotSeq: Math.floor(Date.now() / 1000), people };
      return done(res);
    },
  ],
  ["POST", /^\/api\/realtime\/reactions$/, () => done(null)],
  [
    "POST",
    /^\/api\/realtime\/ride$/,
    ({ me, body }) => {
      const email = String(body.captainEmail ?? "");
      if (email === me) return fail(400, "RIDE_SELF", "자기 자신은 따라갈 수 없어요.");
      const captain = state().users.get(email);
      if (!captain) return fail(404, "USER_NOT_FOUND", "없는 사용자입니다.");
      if (!captain.online) return fail(409, "RIDE_CAPTAIN_INACTIVE", "지금 접속해 있지 않은 사람이에요.");
      state().riding.set(me, email);
      const musicId = whereIs(email, me, 0);
      const { x, y } = pointIn(musicId, 0);
      const s = state();
      const res: RideResponse = {
        captainEmail: email,
        playHistoryId: s.nextPlayId++,
        musicId,
        layer: 0,
        x,
        y,
        cellX: Math.floor(x * 4),
        cellY: Math.floor(y * 4),
        playback: "PLAYING",
        positionMs: (Date.now() % 90) * 1000,
        snapshotSeq: Math.floor(Date.now() / 1000),
        panel: { open: false, musicId: null, tab: null },
      };
      return done(res);
    },
  ],
  [
    "DELETE",
    /^\/api\/realtime\/ride$/,
    ({ me }) => {
      const captain = riding(me);
      state().riding.delete(me);
      const musicId = captain ? whereIs(captain.email, me, 0) : (state().lastPlayed.get(me) ?? pool()[0].musicId);
      const { x, y } = pointIn(musicId, 0);
      const res: DismountResponse = { musicId, layer: 0, x, y, cellX: Math.floor(x * 4), cellY: Math.floor(y * 4) };
      return done(res);
    },
  ],
  [
    "DELETE",
    /^\/api\/realtime\/ride\/fleet$/,
    ({ me }) => {
      for (const [rider, captain] of state().riding) if (captain === me) state().riding.delete(rider);
      const res: DisbandResponse = { riderCount: 0, musicId: state().lastPlayed.get(me) ?? pool()[0].musicId, layer: 0 };
      return done(res);
    },
  ],
  [
    "GET",
    /^\/api\/realtime\/ride\/ranking$/,
    ({ q }) => {
      const limit = Math.max(1, Number(q.get("limit")) || 10);
      const list = [...state().users.values()]
        .map((u) => ({ u, n: riderCount(u) }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, limit)
        .map((x, i) => ({ rank: i + 1, email: x.u.email, nickname: x.u.nickname, imageUrl: x.u.imageUrl, riderCount: x.n }));
      return done(list);
    },
  ],

  [
    "GET",
    /^\/api\/stats\/weekly$/,
    ({ me }) => {
      const { start, end } = weekRange();
      const week = Math.floor(start / DAY);
      const s = state();
      const base = (u: MockUser, salt: string, max: number) => Math.floor(seeded(hash(`${u.email}|${salt}|${week}`))() * max);
      return done({
        weekStart: iso(start),
        weekEnd: iso(end),
        discovery: rankedUsers((u) => base(u, "d", 40) + (u.email === me ? Math.ceil((s.plays.get(me) ?? 0) / 3) : 0)),
        explore: rankedUsers((u) => base(u, "e", 260) + (s.plays.get(u.email) ?? 0)),
        contribution: rankedUsers((u) => base(u, "c", 6) + (s.reports.get(u.email) ?? 0)),
      });
    },
  ],

  ["GET", /^\/api\/taste-analysis$/, ({ me }) => tasteResponse(me, false)],
  ["POST", /^\/api\/taste-analysis$/, ({ me }) => tasteResponse(me, true)],

  ["GET", /^\/api\/artwork\/round\/current$/, ({ me }) => done(round(me))],
  ["GET", /^\/api\/artwork\/templates$/, () => done(TEMPLATES.map(({ name, label, pointCount }) => ({ name, label, pointCount })))],
  [
    "GET",
    /^\/api\/artwork\/leaderboard$/,
    ({ me, q }) => {
      const page = Math.max(0, Number(q.get("page")) || 0);
      const size = Math.max(1, Number(q.get("size")) || 50);
      const all = rankedArtworks();
      return done({
        round: round(me),
        items: all.slice(page * size, (page + 1) * size).map(({ a, rank, rankScore }) => artworkSummary(a, rank, rankScore, me)),
        page,
        size,
        totalCnt: all.length,
      });
    },
  ],
  [
    "GET",
    /^\/api\/artwork\/mine$/,
    ({ me }) =>
      done(
        rankedArtworks()
          .filter(({ a }) => a.owner === me)
          .sort((x, y) => y.a.createdMs - x.a.createdMs)
          .map(({ a, rank, rankScore }) => artworkSummary(a, rank, rankScore, me)),
      ),
  ],
  [
    "GET",
    /^\/api\/artwork\/detail$/,
    ({ q }) => {
      const a = state().artworks.get(Number(q.get("artworkId")));
      if (!a) return fail(404, "ARTWORK_NOT_FOUND", "없는 작품입니다.");
      const res: BackendArtworkDetail = { artworkId: a.id, closed: a.closed, tracks: a.tracks };
      return done(res);
    },
  ],
  [
    "POST",
    /^\/api\/artwork\/draw$/,
    ({ body }) => {
      const points = Array.isArray(body.points) ? (body.points as { x: number; y: number }[]) : [];
      const { tracks, fitError } = traceShape(points, hash(JSON.stringify(points)));
      const score = Math.round(Math.max(0, Math.min(1, 1 - fitError)) * 100);
      const res: BackendDrawResponse = { score, quality: score >= 90 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW", points: tracks };
      return done(res);
    },
  ],
  [
    "POST",
    /^\/api\/artwork\/generate$/,
    ({ me, body }) => {
      const template = TEMPLATES.find((t) => t.name === body.template);
      if (!template) return fail(400, "INVALID_INPUT", "없는 모양입니다.");
      const { tracks, fitError } = traceShape(template.shape, hash(`${template.name}|${Date.now()}`));
      const playlist = addPlaylist(state(), me, uniqueName(me, `${template.label} 별자리`), tracks.map((t) => t.musicId));
      return done({
        playlistId: playlist.id,
        playlistName: playlist.name,
        template: template.name,
        musicCnt: tracks.length,
        fitError: r3(fitError),
        points: tracks.map((t) => ({ musicId: t.musicId, x: t.x, y: t.y })),
      });
    },
  ],
  [
    "POST",
    /^\/api\/artwork\/submit$/,
    ({ me, body }) => {
      const s = state();
      const p = playlistOf(Number(body.playlistId));
      if (!p) return fail(404, "PLAYLIST_NOT_FOUND", "없는 플레이리스트입니다.");
      if (p.owner !== me) return fail(403, "FORBIDDEN", "내 플레이리스트만 출품할 수 있어요.");
      if (p.musicIds.length < 3) return fail(400, "INVALID_INPUT", "곡이 3개 이상이어야 출품할 수 있어요.");
      const id = s.nextArtworkId++;
      const rand = seeded(id * 7919);
      s.artworks.set(id, {
        id,
        owner: me,
        title: p.name,
        playlistId: p.id,
        closed: body.closed === true,
        tracks: tracksOf(p.musicIds),
        createdMs: Date.now(),
        score: 62 + Math.floor(rand() * 34),
        comment: AI_COMMENTS[Math.floor(rand() * AI_COMMENTS.length)],
        baseLikes: 0,
      });
      return done({ artworkId: id, status: "PENDING" });
    },
  ],
  [
    "POST",
    /^\/api\/artwork\/like$/,
    ({ me, body }) => {
      const s = state();
      const a = s.artworks.get(Number(body.artworkId));
      if (!a) return fail(404, "ARTWORK_NOT_FOUND", "없는 작품입니다.");
      if (a.owner === me) return fail(400, "ARTWORK_VOTE_SELF", "내 작품에는 좋아요를 줄 수 없어요.");
      const key = `${me}>${a.id}`;
      if (body.liked === true && !s.artworkLikes.has(key)) {
        if (round(me).myVotesLeft === 0) return fail(409, "ARTWORK_VOTE_LIMIT", "좋아요를 모두 썼어요.");
        s.artworkLikes.add(key);
      }
      if (body.liked !== true) s.artworkLikes.delete(key);
      return done({ artworkId: a.id, liked: s.artworkLikes.has(key), likeCnt: artworkLikes(a) });
    },
  ],
  [
    "POST",
    /^\/api\/artwork\/retry\/(\d+)$/,
    ({ m }) => (state().artworks.has(Number(m[1])) ? fail(409, "ARTWORK_NOT_FAILED", "실패한 작품만 다시 채점할 수 있어요.") : fail(404, "ARTWORK_NOT_FOUND", "없는 작품입니다.")),
  ],
];

function parseBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== "string") return {};
  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function mockBackend(path: string, init?: RequestInit): Promise<Response> {
  const url = new URL(path, "http://mock.local");
  const method = (init?.method ?? "GET").toUpperCase();
  const me = emailOf(new Headers(init?.headers).get("authorization")) ?? DEMO_EMAIL;
  for (const [verb, pattern, handle] of HANDLERS) {
    if (verb !== method) continue;
    const m = url.pathname.match(pattern);
    if (!m) continue;
    return handle({ me, q: url.searchParams, body: parseBody(init?.body), form: init?.body instanceof FormData ? init.body : null, m });
  }
  return fail(404, "NOT_IMPLEMENTED", `데모에서 지원하지 않는 요청입니다: ${method} ${url.pathname}`);
}
