export const REPORT_REASONS = [
  { value: "spoken", label: "말소리", detail: "노래가 아니라 말소리·나레이션이에요" },
  { value: "noise", label: "잡음", detail: "잡음이나 소음만 들려요" },

  { value: "mistitled", label: "제목 다름", detail: "제목이 실제 곡과 달라요" },

  { value: "other", label: "기타", detail: "그 밖의 이유예요" },

  { value: "unplayable", label: "재생 불가", detail: "음원을 찾을 수 없어 재생되지 않아요", unplayableOnly: true },
] as const;

export const reportReasonsFor = (unplayable: boolean) => REPORT_REASONS.filter((r) => unplayable || !("unplayableOnly" in r));

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REPORT_NEEDS_DETAIL: ReportReason = "other";

export const REPORT_DETAIL_MAX = 2000;

export const REPORT_DETAIL_PLACEHOLDER = "무엇이 문제인지 한 줄로 적어주세요";

export const REPORT_SENT_NOTICE = "신고를 보냈어요. 검토에 참고할게요";

export const REPORT_FAILED_NOTICE = "신고를 보내지 못했어요. 잠시 후 다시 시도해 주세요";
