import { containsSong, type Exploration, type ListeningFlow } from "./listening-flow";
import type { SurveyEdge } from "@/types/survey";

export function logSurveySkip(musicId: number, reason: string) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`%c[ODY 설문 ⏭ 건너뜀]%c musicId ${musicId} — ${reason}`, "color:#93a4c4;font-weight:600", "color:inherit");
}

export function logSurveyHear(input: {
  musicId: number;
  exploration: Exploration | null;
  pending: SurveyEdge | null;
  flow: ListeningFlow | null;
  answered: (edge: SurveyEdge) => boolean;
}) {
  if (process.env.NODE_ENV === "production") return;
  const { musicId, exploration, pending, flow } = input;

  const blocker = !exploration
    ? "탐색 스냅샷이 없다 — 주변·여정 맥락이 아니거나, 추천 결과 확인이 실패·10초 초과했다"
    : !containsSong(exploration, musicId)
      ? `이 곡이 그 탐색 목록에 없다 (${exploration.mode})`
      : flow?.unplayable.has(musicId)
        ? "이 곡이 재생 불가다 — 들려주지 못한 곡은 묻지 않는다"
        : pending == null
          ? exploration.mode === "nearby"
            ? "간선 없음 — 기준곡이 재생 불가이거나, 이 곡이 이웃 목록 밖이다 (기준곡 청취는 이제 안 따진다)"
            : "간선 없음 — 직전에 소리가 난 곡이 있어야 한다 (첫 정거장이거나, 못 튼 곡만 지나왔거나)"
          : null;

  const head = blocker ?? `${pending!.compare.title} → ${pending!.subject.title} (rank ${pending!.target.rank}) · 이 곡을 떠나는 순간 뜬다`;
  const badge = blocker ? "🚫 안 뜸" : "📝 뜰 예정";
  const tone = blocker ? "color:#93a4c4" : "color:#4fe3ce";
  const where = exploration ? (exploration.mode === "nearby" ? `주변 탐색(기준 ${exploration.center.musicId})` : "여정") : "맥락 없음";

  console.groupCollapsed(`%c[ODY 설문 ${badge}]%c musicId ${musicId} · ${where} — ${head}`, `${tone};font-weight:600`, "color:inherit");
  console.log("탐색", exploration ? { mode: exploration.mode, key: exploration.key } : null);
  console.log("자취", flow ? { 들은곡: [...flow.played], 직전곡: flow.lastPlayed, 못튼곡: [...flow.unplayable] } : null);
  console.log("물을 간선", pending?.target ?? null);
  console.groupEnd();
}
