import { eulReul, iGa } from "@/lib/josa";

export const ACTIVITY_KINDS = ["follow", "journey", "playlist", "nearby"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  follow: "따라가기",
  journey: "여정 재생",
  playlist: "플레이리스트 재생",
  nearby: "주변 음악 재생",
};

export const ACTIVITY_CONFIRM = {
  title: (next: ActivityKind) => `${ACTIVITY_LABELS[next]}${eulReul(ACTIVITY_LABELS[next])} 시작할까요?`,
  message: (current: ActivityKind, currentDetail: string | null, next: ActivityKind) => {
    const cur = ACTIVITY_LABELS[current];
    const detail = currentDetail ? ` (${currentDetail})` : "";
    return `지금 진행 중인 ${cur}${detail}${iGa(currentDetail ?? cur)} 멈춥니다. 멈추고 ${ACTIVITY_LABELS[next]}${eulReul(ACTIVITY_LABELS[next])} 시작할까요?`;
  },
  confirm: "멈추고 시작",
  cancel: "취소",
} as const;

export const LEAVE_LIST_CONFIRM = {
  title: "이 곡만 재생할까요?",
  message: (current: ActivityKind, currentDetail: string | null) => {
    const cur = ACTIVITY_LABELS[current];
    const detail = currentDetail ? ` (${currentDetail})` : "";
    return `목록 밖의 곡이라 지금 진행 중인 ${cur}${detail}${iGa(currentDetail ?? cur)} 멈추고 목록이 닫힙니다. 이 곡만 재생할까요?`;
  },
  confirm: "멈추고 재생",
  cancel: "취소",
} as const;
