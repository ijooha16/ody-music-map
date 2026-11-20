import type { Email, Id, ISODateString } from "./common";

export interface Contest {
  roundId: Id;

  theme: string;
  startsAt: ISODateString;
  endsAt: ISODateString;

  voteLimit: number;

  myVotesLeft: number | null;
}

export interface SketchPoint {
  x: number;
  y: number;
}

export interface ContestTrack {
  musicId: Id;
  title: string | null;
  artist: string | null;
  x: number;
  y: number;
}

export interface ContestArtworkShape {
  artworkId: Id;
  tracks: ContestTrack[];
  closed: boolean;
}

export type MatchQuality = "HIGH" | "MEDIUM" | "LOW";

export interface ContestTemplate {
  name: string;
  label: string;
  pointCount: number;
}

export interface ContestMatch {
  score: number;
  quality: MatchQuality;

  tracks: ContestTrack[];

  template?: {
    name: string;
    label: string;
    playlistId: Id;
    playlistName: string;

    fitError: number;
  };
}

export type ArtworkStatus = "PENDING" | "SCORED" | "FAILED";

export interface ContestEntry {
  artworkId: Id;

  rank: number | null;
  title: string;
  ownerEmail: Email | null;

  ownerNickname: string | null;
  status: ArtworkStatus;

  score: number | null;
  aiComment: string | null;

  failReason: string | null;
  likeCnt: number;
  likedByMe: boolean;
  musicCnt: number;
  createdAt: ISODateString;

  rankScore: number | null;

  closed: boolean;

  tracks: ContestTrack[];

  playlistId: Id | null;
}

export interface ContestLeaderboard {
  round: Contest;

  items: ContestEntry[];
  page: number;
  size: number;
  totalCnt: number;
}

export interface ContestSubmitResult {
  artworkId: Id;
  status: ArtworkStatus;

  playlistId: Id;
}

export interface ContestLikeResult {
  artworkId: Id;
  liked: boolean;

  likeCnt: number;
}

export type ContestSort = "rank" | "latest" | "likes" | "ai";
