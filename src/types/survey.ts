import type { Id } from "./common";

export type SurveyMode = "nearby" | "journey";

export type SurveyReason = "dup" | "mood" | "tempo" | "spoken" | "compare";

export interface SurveyReasonOption {
  value: SurveyReason;
  label: string;
}

export interface SurveyDefinition {
  mode: SurveyMode;

  compareLabel: string;
  question: string;

  yes: string;
  reasonQuestion: string;
  reasons: readonly SurveyReasonOption[];
}

export interface SurveyTarget {
  sessionId: string;
  mode: SurveyMode;

  rank: number;

  anchorMusicId: Id;

  targetMusicId?: Id;

  prevMusicId?: Id;

  musicId: Id;
}

export const questionKey = (t: { mode: SurveyMode; anchorMusicId: Id; prevMusicId?: Id | null; musicId: Id }) =>
  `${t.mode}|${t.anchorMusicId}|${t.prevMusicId ?? ""}|${t.musicId}`;

export interface SurveyEdge {
  target: SurveyTarget;

  subject: SurveySong;

  compare: SurveySong;
}

export interface SurveySong {
  musicId: Id;
  title: string;
  artist: string | null;

  durationSec?: number | null;

  genreId: number | null;
}

export interface SurveySubmission extends SurveyTarget {
  anonymousId: string;

  verdict: boolean | null;

  reason: SurveyReason | null;

  listenedSec: number;

  skipped: boolean;
}

export interface AnsweredRow {
  mode: SurveyMode;
  anchorMusicId: Id;
  prevMusicId: Id | null;
  musicId: Id;
  verdict: boolean;
}
