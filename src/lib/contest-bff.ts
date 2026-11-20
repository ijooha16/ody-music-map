import { failLive } from "@/lib/api-response";
import type { BackendError } from "@/lib/backend";
import type { ApiErrorCode, Contest, ContestArtworkShape, ContestEntry, ContestMatch, ContestTrack } from "@/types";

export interface BackendArtworkRound {
  roundId: number;
  theme: string;
  startsAt: string;
  endsAt: string;
  voteLimit: number;
  myVotesLeft: number | null;
}

export interface BackendArtworkTrack {
  musicId: number;
  title: string | null;
  artist: string | null;
  x: number;
  y: number;
}

export interface BackendArtworkSummary {
  artworkId: number;
  rank: number | null;
  title: string;
  ownerEmail: string | null;

  ownerNickname: string | null;
  status: "PENDING" | "SCORED" | "FAILED";
  score: number | null;
  aiComment: string | null;
  failReason: string | null;
  likeCnt: number;
  likedByMe: boolean;
  musicCnt: number;
  createdAt: string;
  rankScore: number | null;
  closed: boolean;
  points: BackendArtworkTrack[] | null;

  playlistId?: number | null;
}

export interface BackendDrawResponse {
  score: number;
  quality: "HIGH" | "MEDIUM" | "LOW";
  points: BackendArtworkTrack[];
}

export const toRound = (r: BackendArtworkRound): Contest => ({
  roundId: r.roundId,
  theme: r.theme,
  startsAt: r.startsAt,
  endsAt: r.endsAt,
  voteLimit: r.voteLimit,
  myVotesLeft: r.myVotesLeft ?? null,
});

export const toTrack = (p: BackendArtworkTrack): ContestTrack => ({ musicId: p.musicId, title: p.title ?? null, artist: p.artist ?? null, x: p.x, y: p.y });

export interface BackendArtworkDetail {
  artworkId: number;
  closed: boolean;

  tracks: BackendArtworkTrack[] | null;
}

export const toShape = (d: BackendArtworkDetail): ContestArtworkShape => ({ artworkId: d.artworkId, closed: d.closed, tracks: (d.tracks ?? []).map(toTrack) });

export const toEntry = (s: BackendArtworkSummary): ContestEntry => ({
  artworkId: s.artworkId,
  rank: s.rank ?? null,
  title: s.title,
  ownerEmail: s.ownerEmail ?? null,
  ownerNickname: s.ownerNickname ?? null,
  status: s.status,
  score: s.score ?? null,
  aiComment: s.aiComment ?? null,
  failReason: s.failReason ?? null,
  likeCnt: s.likeCnt,
  likedByMe: s.likedByMe,
  musicCnt: s.musicCnt,
  createdAt: s.createdAt,
  rankScore: s.rankScore ?? null,
  closed: s.closed,
  tracks: (s.points ?? []).map(toTrack),
  playlistId: s.playlistId ?? null,
});

export const toMatch = (d: BackendDrawResponse): ContestMatch => ({ score: d.score, quality: d.quality, tracks: d.points.map(toTrack) });

const PASS_THROUGH = new Set<string>([
  "ARTWORK_NOT_FOUND",
  "ARTWORK_ROUND_CLOSED",
  "ARTWORK_NOT_FAILED",
  "ARTWORK_RETRY_EXHAUSTED",
  "ARTWORK_DRAWING_DEGENERATE",
  "ARTWORK_VOTE_LIMIT",
  "ARTWORK_VOTE_SELF",
  "PLAYLIST_NAME_DUPLICATED",
  "PLAYLIST_NOT_FOUND",
  "MUSIC_NOT_FOUND",
  "INVALID_INPUT",
  "FORBIDDEN",
]);

export function artworkCode(err: BackendError): ApiErrorCode {
  if (PASS_THROUGH.has(err.code)) return err.code as ApiErrorCode;

  if (err.status === 401) return "UNAUTHENTICATED";
  return "INTERNAL_ERROR";
}

export function artworkFail(e: unknown, upstream: string) {
  const err = e as BackendError;
  return failLive(artworkCode(err), err.message ?? "콘테스트 처리에 실패했습니다.", err.status || 502, upstream);
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
