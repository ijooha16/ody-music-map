export const CHART_TYPES = [
  { key: "discovery", label: "이번주 발견왕", short: "발견왕", unit: "곡", description: "이번 주 처음 재생된 곡을 가장 많이 찾아낸 사람", empty: "이번 주에는 아직 기록이 없어요." },
  { key: "explore", label: "이번주 탐험왕", short: "탐험왕", unit: "회", description: "이번 주 재생 횟수가 가장 많은 사람 (같은 곡을 다시 들어도 센다)", empty: "이번 주에는 아직 기록이 없어요." },
  { key: "contribution", label: "이번주 기여도", short: "기여도", unit: "건", description: "이번 주 잘못된 곡을 가장 많이 신고한 사람", empty: "이번 주에는 아직 기록이 없어요." },
  { key: "topDriver", label: "실시간 탑 선장", short: "선장", unit: "명", description: "지금 가장 많은 사람을 태우고 있는 사람", empty: "지금 운행 중인 우주선이 없어요." },
] as const;
export type ChartType = (typeof CHART_TYPES)[number]["key"];

export type WeeklyChartType = Exclude<ChartType, "topDriver">;

export const TOP_DRIVER = {
  limit: 10,
  staleMs: 2_000,
  refreshCooldownMs: 3_000,
  agoTickMs: 30_000,
} as const;
