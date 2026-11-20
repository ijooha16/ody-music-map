import type { Email, Id, ISODateString } from "./common";
import type { Music } from "./music";
import type { User } from "./user";

export interface UserProfile extends User {
  isOnline: boolean;

  isBot: boolean;
  followerCount: number;
  followingCount: number;

  daysSinceJoined: number;

  nowPlaying: Pick<Music, "id" | "title" | "artist"> | null;

  meetingCount: number | null;

  isFollowing: boolean;

  followingTarget: Pick<User, "email" | "nickname"> | null;
  dashboard: ProfileDashboard;
}

export interface ProfileDashboard {
  exploredCount: number | null;

  discoveredCount: number | null;

  moodPreference: { mood: string; percent: number }[];
}

export interface NearbyUser {
  email: Email;
  nickname: string | null;
  imageUrl: string | null;
  isOnline: boolean;

  musicId: Id;

  viewingMusicId: Id;

  genreId: Id;

  meetingCount: number;

  riderCount: number;

  followingNickname: string | null;

  avatarSeed: number[];

  x?: number;
  y?: number;
}

export interface UserRankingItem {
  rank: number;
  email: Email;
  nickname: string | null;
  imageUrl: string | null;
  score: number;
}

export interface WeeklyRanking {
  weekStart: ISODateString;
  weekEnd: ISODateString;

  discovery: UserRankingItem[];

  explore: UserRankingItem[];

  contribution: UserRankingItem[];
}

export interface FollowResponse {
  followerEmail: string;
  followeeEmail: string;
  isFollowing: boolean;
  followeeFollowerCnt: number;
}

export interface FollowUserSummary {
  email: string;
  name: string | null;
  nickname: string | null;
  imageUrl: string | null;
  isFollowing: boolean;

  lastActiveAt: string | null;

  isOnline: boolean;

  meetingCnt: number;
}

export interface FollowListResponse {
  type: "follower" | "following";
  content: FollowUserSummary[];
  page: number;
  size: number;
  hasNext: boolean;
}
