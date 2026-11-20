import type { ContestSort, MatchQuality } from "@/types";

export const SKETCH_RULES = {
  minPoints: 3,
  maxPoints: 20,

  titleMax: 30,
} as const;

export const CONTEST_LEADERBOARD_SIZE = 50;

export const CONTEST_SCORING_POLL_MS = 5000;

export const CONTEST_TABS = [
  { key: "sketch", label: "별자리 그리기" },
  { key: "gallery", label: "갤러리" },
  { key: "ranking", label: "순위" },
] as const;
export type ContestTab = (typeof CONTEST_TABS)[number]["key"];

export const CONTEST_SORTS = [
  { key: "rank", label: "순위순" },
  { key: "latest", label: "최신순" },
  { key: "likes", label: "좋아요순" },
  { key: "ai", label: "AI 점수순" },
] as const satisfies ReadonlyArray<{ key: ContestSort; label: string }>;

export const MATCH_QUALITY_LABEL: Record<MatchQuality, string> = {
  HIGH: "그린 모양과 잘 맞아요",
  MEDIUM: "그린 모양과 대체로 비슷해요",
  LOW: "그린 모양과 꽤 달라요",
};

export const SKETCH_STEPS = [
  { key: "draw", label: "그리기" },
  { key: "review", label: "곡 확인" },
  { key: "submit", label: "이름 짓고 출품" },
  { key: "scoring", label: "AI 채점" },

  { key: "done", label: "완성" },
] as const;
export type SketchStep = (typeof SKETCH_STEPS)[number]["key"];

export const SKETCH_HIT_PX = 12;

export const CONTEST_TOP = 5;

export const CONTEST_RANK_TAG = (rank: number) => `🏆 이벤트 ${rank}위`;

export const CONTEST_ARTWORK_THUMB_PX = 200;

export const MY_ARTWORK_THUMB_PX = 280;

export const PODIUM = { order: [1, 0, 2], thumbPx: [168, 128, 116] } as const;

export const CONTEST_SAVE_DUPLICATED = "이미 같은 이름의 플리가 있어요 · 이미 가져온 별자리일 수 있어요";
