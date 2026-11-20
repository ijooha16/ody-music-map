export type TasteState = "EMPTY" | "DISTRIBUTION_ONLY" | "READY" | "FRESH" | "STALE" | "IN_PROGRESS";

export type TasteGenerationStatus = "NOT_REQUESTED" | "INELIGIBLE" | "IN_PROGRESS" | "GENERATED" | "FALLBACK";

export type TasteReportLevel = "INITIAL" | "STANDARD";

export interface TasteCounts {
  totalLiked: number;

  valid: number;
  excluded: number;

  exclusions: Record<string, number>;
}

export interface TasteEligibility {
  eligible: boolean;

  level: TasteReportLevel | null;

  additionalLikesNeeded: number;
}

export interface TasteNarrative {
  findingId: string;
  text: string;
  evidence: string;
}

export type TasteFindingType = "CONSISTENT_BIAS" | "BIAS" | "DIVERSE" | "BALANCED";
export type TasteFindingDirection = "LOW" | "HIGH" | "BOTH" | "CENTER";

export interface TasteFinding {
  id: string;
  type: TasteFindingType;

  pc: number | null;
  direction: TasteFindingDirection;

  effectSize: number;
  evidence: string;
  axisPhrase: string;
}

export interface TasteReport {
  level: TasteReportLevel;

  aiGenerated: boolean;

  fresh: boolean;
  summary: string;
  narratives: TasteNarrative[];

  findings?: TasteFinding[];

  analyzedAt: string;
  generatedAt: string;

  lastRefreshedAt: string | null;
}

export interface TasteGeneration {
  status: TasteGenerationStatus;
  generatedThisRequest: boolean;

  dailyLimitUsedToday: boolean;
  canRetry: boolean;

  failureCode: string | null;

  nextAvailableAt: string | null;
}

export interface TasteAxisLabel {
  status: string;
  strength: string;

  axis: string | null;
  low: string;
  high: string;

  lowTag?: string | null;
  highTag?: string | null;
  evidence: string;
}

export interface TasteAxisStatistics {
  pc: number;
  raw: { min: number; q1: number; median: number; q3: number; max: number };
  percentile: { min: number; q1: number; median: number; q3: number; max: number; iqr: number };
  histogram: number[];
  explainedVariance: number;
  label: TasteAxisLabel;
}

export interface TastePoint {
  musicId: number;
  title: string;
  artist: string | null;
  coordinates: number[];
}

export interface TasteAnalysis {
  state: TasteState;
  counts: TasteCounts;
  reportEligibility: TasteEligibility;
  analysisVersion: string;
  axes: TasteAxisStatistics[];
  points: TastePoint[];

  report: TasteReport | null;
  generation: TasteGeneration;
}
