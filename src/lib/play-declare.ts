import type { PlaySource } from "@/types";

export type PlayContextKind = "single" | "playlist" | "journey" | "nearby";

export function playSourceOf(kind: PlayContextKind): PlaySource {
  if (kind === "journey") return "JOURNEY";
  if (kind === "playlist") return "PLAYLIST";
  return "MAP";
}

export interface DeclareInput {
  musicId: number | null;

  declareSeq: number;

  lastSeq: number | null;
  riding: boolean;
}

export function shouldDeclare({ musicId, declareSeq, lastSeq, riding }: DeclareInput): boolean {
  if (musicId == null) return false;

  if (riding) return false;
  return declareSeq !== lastSeq;
}
