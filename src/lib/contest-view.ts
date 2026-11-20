import type { SketchStep } from "@/constants/contest";
import type { Contest, ContestEntry, ContestSort, MatchQuality } from "@/types";

export type RoundPhase = "UPCOMING" | "OPEN" | "CLOSED";

export function roundPhase(round: Pick<Contest, "startsAt" | "endsAt">, now: number = Date.now()): RoundPhase {
  if (now < new Date(round.startsAt).getTime()) return "UPCOMING";
  if (now >= new Date(round.endsAt).getTime()) return "CLOSED";
  return "OPEN";
}

export function sortEntries(items: readonly ContestEntry[], sort: ContestSort): ContestEntry[] {
  const list = [...items];
  switch (sort) {
    case "latest":
      return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case "likes":
      return list.sort((a, b) => b.likeCnt - a.likeCnt || (b.score ?? -1) - (a.score ?? -1));
    case "ai":
      return list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.likeCnt - a.likeCnt);
    default:
      return list.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  }
}

export function templateScore(fitError: number): { score: number; quality: MatchQuality } {
  const score = Math.round(Math.max(0, Math.min(1, 1 - fitError)) * 100);
  return { score, quality: score >= 90 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW" };
}

export function ownerLabel(email: string | null, nickname?: string | null): string {
  const name = nickname?.trim();
  if (name) return name;
  if (!email) return "익명";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

export function awaitingScore(mine: readonly ContestEntry[] | undefined): boolean {
  return !!mine?.some((e) => e.status === "PENDING");
}

export function myEntry(mine: readonly ContestEntry[] | undefined): ContestEntry | null {
  return mine?.[0] ?? null;
}

export function backStep(step: SketchStep): SketchStep | null {
  return step === "review" ? "draw" : step === "submit" ? "review" : null;
}

export function visibleStep(step: SketchStep, state: { hasMine: boolean; hasMatch: boolean; mineScored?: boolean }): SketchStep {
  if (step === "scoring" || step === "done") {
    if (!state.hasMine) return "draw";
    return state.mineScored ? "done" : "scoring";
  }
  if ((step === "review" || step === "submit") && !state.hasMatch) return "draw";
  return step;
}
