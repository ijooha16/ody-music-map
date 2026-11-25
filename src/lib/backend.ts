import { NextResponse } from "next/server";
import { BOT_FOLLOWER_BONUS, NO_GENRE_ID } from "@/constants";
import { seedOf } from "@/lib/avatar-seed";
import { PC_DIMS, type MapPoint } from "@/types";
import type { Music, PlaylistSummary, User, UserProfile } from "@/types";
import { mockBackend } from "@/mocks/backend";
import { failLive, LIVE_HEADERS } from "./api-response";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "https://j15a405.p.ssafy.io";
const BACKEND_ACCESS_TOKEN = process.env.BACKEND_ACCESS_TOKEN;

export function isBackendEnabled(): boolean {
  return process.env.USE_MOCK_API !== "1";
}

export class BackendError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

async function callerToken(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    return (await headers()).get("authorization");
  } catch {
    return null;
  }
}

export function authHeader(caller: string | null | undefined, service: string | undefined): Record<string, string> {
  if (caller) return { Authorization: caller };
  if (service) return { Authorization: `Bearer ${service}` };
  return {};
}

async function backendFetch<T>(path: string, init?: RequestInit, opts?: { allowNullData?: boolean }): Promise<T> {
  const headers = {
    ...authHeader(await callerToken(), BACKEND_ACCESS_TOKEN),
    ...init?.headers,
  };
  const res = isBackendEnabled()
    ? await fetch(`${BACKEND_ORIGIN}${path}`, { ...init, headers, cache: "no-store" })
    : await mockBackend(path, { ...init, headers });

  const text = await res.text();
  let body: Envelope<T> | null = null;
  try {
    body = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new BackendError(
      res.status,
      "BACKEND_PATH_NOT_PROXIED",
      `${path} 가 JSON 을 주지 않았습니다. nginx 가 이 경로를 백엔드로 넘기지 않는 것으로 보입니다 (B-16).`,
    );
  }

  if (res.status === 401) {
    throw new BackendError(
      401,
      "BACKEND_AUTH_REQUIRED",
      `${path} 가 401 입니다. 백엔드 인증이 다시 걸린 것으로 보입니다 (BACKEND-NOTES A-17 원복). BACKEND_ACCESS_TOKEN 을 넣거나 USE_MOCK_API=1 로 목을 쓰세요.`,
    );
  }

  if (!res.ok || !body.success || (body.data == null && !opts?.allowNullData)) {
    throw new BackendError(res.status, body.error?.code ?? "UNKNOWN", body.error?.message ?? "백엔드 호출에 실패했습니다.");
  }

  return body.data as T;
}

export function backendGet<T>(path: string, init?: RequestInit, opts?: { allowNullData?: boolean }): Promise<T> {
  return backendFetch<T>(path, init, opts);
}

export function backendPost<T>(path: string, body: unknown, init?: RequestInit, opts?: { allowNullData?: boolean }): Promise<T> {
  return backendFetch<T>(
    path,
    { ...init, method: "POST", headers: { "Content-Type": "application/json", ...init?.headers }, body: JSON.stringify(body) },
    opts,
  );
}

export function backendDelete(path: string, init?: RequestInit): Promise<unknown> {
  return backendFetch<unknown>(path, { ...init, method: "DELETE" }, { allowNullData: true });
}

export function backendPatchForm<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  return backendFetch<T>(path, { ...init, method: "PATCH", body: form });
}

export function backendPatch<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return backendFetch<T>(path, {
    ...init,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: JSON.stringify(body),
  });
}

export function callerAuth(req: Request): Record<string, string> {
  const token = req.headers.get("authorization");
  return token ? { Authorization: token } : {};
}

export function emailFromToken(req: Request): string | null {
  const payload = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

const REFRESH_PATH = { from: "Path=/api/auth", to: "Path=/" } as const;

export async function backendProxy(req: Request, upstream: string, method: "POST" | "PATCH" = "POST") {
  const cookie = req.headers.get("cookie");
  const body = await req.text();
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...callerAuth(req),

      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body || undefined,
  };
  const res = isBackendEnabled() ? await fetch(`${BACKEND_ORIGIN}${upstream}`, { ...init, cache: "no-store" }) : await mockBackend(upstream, init);

  const text = await res.text();

  if (!text.trimStart().startsWith("{")) {
    return failLive("INTERNAL_ERROR", `${upstream} 가 JSON 을 주지 않았습니다. nginx 가 이 경로를 백엔드로 넘기지 않는 것으로 보입니다 (B-16).`, 502, upstream);
  }

  const out = new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  for (const cookie of res.headers.getSetCookie()) out.headers.append("Set-Cookie", cookie.replace(REFRESH_PATH.from, REFRESH_PATH.to));
  out.headers.set(LIVE_HEADERS.source, "live");
  out.headers.set(LIVE_HEADERS.upstream, upstream);
  return out;
}

type BackendLocation = Record<`pc${number}`, number>;

interface BackendMusicSummary {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;

  youtubeUrl: string | null;

  albumMbid?: string | null;
  albumCoverUrl?: string | null;
  location: BackendLocation | null;
}

export interface BackendMusicDetail extends BackendMusicSummary {
  mbid: string;
  bpm: number | null;
  duration: number | null;

  releaseYear: number | null;
  playCnt: number | null;
  youtubeCnt: number | null;
}

export interface BackendMusicDetailResponse extends BackendMusicDetail {
  neighbors: (BackendMusicSummary & { distance: number })[];

  liked?: boolean;
}

export interface BackendMusicLikeResponse {
  musicId: number;
  liked: boolean;
  likedAt: string | null;
}

export interface BackendPlaylistDetailResponse {
  playlistId: number;
  playlistName: string;
  musicCnt: number;
  totalDuration: number;

  likeCnt: number;
  isLiked: boolean;
  musics: BackendMusicDetail[];
}

export interface BackendJourneyResponse {
  musicCnt: number;
  totalDuration: number;
  path: (BackendMusicDetail & { step: number })[];
}

export function toPcArray(location: BackendLocation | null): number[] {
  return Array.from({ length: PC_DIMS }, (_, i) => location?.[`pc${i + 1}`] ?? 0);
}

export interface BackendMapPoint {
  musicId: number;

  pc: number[];
  genreId: number;
  weight: number;
  title: string;
  artist: string | null;

  youtubeUrl?: string | null;

  albumMbid?: string | null;
  albumCoverUrl?: string | null;
  playable: boolean;
}

export function toResidentPoint(p: BackendMapPoint): MapPoint {
  return {
    musicId: p.musicId,
    pc: Array.from({ length: PC_DIMS }, (_, i) => p.pc?.[i] ?? 0),
    genreId: p.genreId,
    weight: p.weight,
    title: p.title,
    artist: p.artist ?? null,
    youtubeUrl: p.youtubeUrl ?? null,
    albumMbid: p.albumMbid ?? null,
    albumCoverUrl: p.albumCoverUrl ?? null,
    playable: p.playable,
  };
}

export function toMusic(res: BackendMusicDetail): Music {
  return {
    id: res.id,
    mbid: res.mbid,
    albumMbid: res.albumMbid ?? null,
    albumCoverUrl: res.albumCoverUrl ?? null,
    title: res.title,
    artist: res.artist,
    releaseYear: res.releaseYear ?? null,
    bpm: res.bpm,
    duration: res.duration,
    album: res.album,
    youtubeUrl: res.youtubeUrl,

    location: res.location ? (toPcArray(res.location) as Music["location"]) : null,
    playCnt: res.playCnt ?? 0,
    youtubeCnt: res.youtubeCnt ?? 0,
  };
}

export function toMapPoint(music: BackendMusicSummary): MapPoint {
  return {
    musicId: music.id,
    pc: toPcArray(music.location),
    genreId: NO_GENRE_ID,
    weight: 1,
    title: music.title,
    artist: music.artist,

    albumMbid: music.albumMbid ?? null,
    albumCoverUrl: music.albumCoverUrl ?? null,
    youtubeUrl: music.youtubeUrl ?? null,
    playable: music.youtubeUrl != null,
  };
}

export interface BackendUserDetail {
  email: string;
  name: string | null;
  nickname: string | null;
  tutorialCompleted: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  imageUrl: string | null;
  followerCnt: number;
  followingCnt: number;
  isFollowing: boolean;
  isMe: boolean;

  playedMusicCnt?: number;

  discoveredMusicCnt?: number;

  isOnline?: boolean;

  isBot?: boolean;
}

export function toUser(u: BackendUserDetail): User {
  return {
    email: u.email,
    name: u.name,
    nickname: u.nickname,
    tutorialCompleted: u.tutorialCompleted,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,

    updatedAt: null,
    imageUrl: u.imageUrl,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function botFollowerBonus(email: string): number {
  const { min, max } = BOT_FOLLOWER_BONUS;
  return min + Math.floor(seedOf(email)[0] * (max - min + 1));
}

export function toUserProfile(u: BackendUserDetail): UserProfile {
  const joined = Date.parse(u.createdAt);
  return {
    ...toUser(u),

    isOnline: u.isOnline ?? false,
    isBot: u.isBot ?? false,
    followerCount: u.followerCnt + (u.isBot ? botFollowerBonus(u.email) : 0),
    followingCount: u.followingCnt,

    daysSinceJoined: Number.isFinite(joined) ? Math.max(1, Math.floor((Date.now() - joined) / DAY_MS) + 1) : 1,
    isFollowing: u.isFollowing,
    nowPlaying: null,
    meetingCount: null,
    followingTarget: null,
    dashboard: {
      exploredCount: u.playedMusicCnt ?? null,

      discoveredCount: u.discoveredMusicCnt ?? null,
      moodPreference: [],
    },
  };
}

export interface BackendPlaylistLikeResponse {
  playlistId: number;
  liked: boolean;
  likeCnt: number;
}

export interface BackendLikedPlaylistSummary {
  playlistId: number;
  playlistName: string;
  musicCnt: number;
  likeCnt: number;
  ownerEmail: string;
  ownerNickname: string | null;
  likedAt: string;
}

export interface BackendPlaylistSummary {
  playlistId: number;
  playlistName: string;
  musicCnt: number;
  createdAt: string;
}

export function toPlaylistSummary(p: BackendPlaylistSummary): PlaylistSummary {
  return { id: p.playlistId, playlistName: p.playlistName, likeCnt: null, itemCount: p.musicCnt, ownerNickname: null };
}
