import type { TasteAnalysis, TasteAxisStatistics, TasteFinding, TasteReport, TasteReportLevel } from "@/types";

export interface TasteView {
  report: TasteReport | null;

  stale: boolean;

  generating: boolean;

  canGenerate: boolean;
  buttonLabel: string;

  notice: string | null;

  badge: TasteBadge | null;

  tags: TasteTag[];
}

export interface TasteBadge {
  text: string;

  title: string;
}

export interface TasteTag {
  id: string;

  text: string;
  strength: "strong" | "mild";

  title: string;
}

export const TASTE_NOTICE = {
  empty: "좋아요한 곡이 아직 없어요. 마음에 드는 곡을 모으면 취향을 읽어 드릴게요.",
  needMore: (n: number) => `${n}곡 더 좋아요하면 취향 리포트를 만들 수 있어요.`,
  generating: "리포트를 만들고 있어요. 조금만 기다려 주세요.",
  dailyLimit: "오늘 몫을 다 썼어요. 내일 다시 만들 수 있어요.",
  stale: "좋아요한 곡이 바뀌었어요. 다시 만들면 지금 취향에 맞춰집니다.",

  fallback: "이번에는 간단한 요약으로 대신했어요.",

  lastFailed: "지난번에는 만들지 못했어요. 다시 해 볼 수 있어요.",
} as const;

export function tasteView(analysis: TasteAnalysis): TasteView {
  const { state, report, reportEligibility: eligibility, generation } = analysis;
  const generating = state === "IN_PROGRESS";
  const stale = state === "STALE";
  const canGenerate = eligibility.eligible && !generating && !generation.dailyLimitUsedToday;

  return {
    report,
    stale,
    generating,
    canGenerate,
    buttonLabel: report ? "다시 만들기" : "리포트 만들기",
    notice: noticeOf(analysis, generating, stale),
    badge: report ? tasteBadge(report.level) : null,
    tags: report ? tasteTags(report.findings ?? [], analysis.axes) : [],
  };
}

export function tasteBadge(level: TasteReportLevel): TasteBadge | null {
  if (level !== "INITIAL") return null;
  return { text: "잠정", title: "좋아요 10~29곡으로 읽은 경향이에요. 30곡부터 표준 리포트가 돼요." };
}

export function tasteTags(findings: TasteFinding[], axes: TasteAxisStatistics[]): TasteTag[] {
  const labelOf = (pc: number | null) => (pc == null ? null : axes.find((a) => a.pc === pc)?.label ?? null);
  return findings.map((f) => {
    const label = labelOf(f.pc);
    const strength: TasteTag["strength"] = f.type === "CONSISTENT_BIAS" || f.type === "DIVERSE" ? "strong" : "mild";
    let text: string;
    if (f.direction === "CENTER") {
      text = "#고른 취향";
    } else if (f.direction === "BOTH") {
      const [low, high] = f.axisPhrase.split(" / ");
      text = label?.axis ? `#${label.axis} 폭넓음` : `#${low} · ${high ?? low} 폭넓음`;
    } else {
      const given = f.direction === "LOW" ? label?.lowTag : label?.highTag;
      text = `#${given ?? `${f.axisPhrase} 곡`}`;
    }
    return { id: f.id, text, strength, title: `${TYPE_TITLE[f.type] ?? f.type} · ${f.evidence}` };
  });
}

const TYPE_TITLE: Record<string, string> = {
  CONSISTENT_BIAS: "한쪽으로 뚜렷하게 모여 있어요",
  BIAS: "한쪽으로 기울어 있지만 폭도 있어요",
  DIVERSE: "양 끝을 다 들어요",
  BALANCED: "어느 쪽으로도 튀지 않아요",
};

function noticeOf(analysis: TasteAnalysis, generating: boolean, stale: boolean): string | null {
  const { state, report, reportEligibility: eligibility, generation } = analysis;

  if (generating) return TASTE_NOTICE.generating;
  if (state === "EMPTY") return TASTE_NOTICE.empty;
  if (!eligibility.eligible) return TASTE_NOTICE.needMore(Math.max(1, eligibility.additionalLikesNeeded));
  if (generation.dailyLimitUsedToday) return TASTE_NOTICE.dailyLimit;
  if (stale) return TASTE_NOTICE.stale;
  if (report && !report.aiGenerated) return TASTE_NOTICE.fallback;

  if (!report && generation.failureCode) return TASTE_NOTICE.lastFailed;
  return null;
}
