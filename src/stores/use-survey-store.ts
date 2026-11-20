import { create } from "zustand";
import { createUuid } from "@/lib/uuid";
import { hearSong, type Exploration, type ListeningFlow } from "@/hooks/survey/listening-flow";
import { questionKey, type SurveyEdge, type SurveySubmission, type SurveyTarget } from "@/types/survey";

interface Visit { musicId: number; accruedMs: number; playingSince: number | null }
interface SurveyState {
  pending: SurveyEdge | null;
  prompt: SurveyEdge | null;
  queued: (() => void) | null;
  resolving: boolean;
  historyLoading: boolean;
  flow: ListeningFlow | null;
  lastAudible: number | null;
  unplayable: ReadonlySet<number>;
  answered: ReadonlySet<string>;
  visit: Visit | null;

  submission: SurveySubmission | null;
  saving: boolean;
  saveError: boolean;
  unansweredSent: boolean;
  enter: (musicId: number | null, playing: boolean, at: number) => void;
  stintMs: (musicId: number) => number;
  hear: (musicId: number, source: Exploration | null) => void;
  markUnplayable: (musicId: number) => void;
  setResolving: (resolving: boolean) => void;
  gate: (resume: () => void) => boolean;
  close: () => void;
  loadAnswered: (keys: readonly string[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  hasAnswered: (target: SurveyTarget) => boolean;
  beginSubmission: (row: SurveySubmission) => boolean;
  finishSubmission: (row: SurveySubmission, success: boolean) => void;
  takeUnanswered: () => SurveyEdge | null;
  resumeAfterPagehide: () => void;
  resetListening: () => void;
}

const listeningInitial = {
  pending: null, prompt: null, queued: null, resolving: false, historyLoading: false, flow: null,
  lastAudible: null, visit: null, submission: null, saving: false, saveError: false,
  unansweredSent: false,
};

export const useSurveyStore = create<SurveyState>()((set, get) => ({
  ...listeningInitial,
  unplayable: new Set(), answered: new Set(),
  enter: (musicId, playing, at) => set((s) => {
    const v = s.visit;
    if (musicId != null && v?.musicId !== musicId) return { visit: { musicId, accruedMs: 0, playingSince: playing ? at : null } };
    if (!v) return s;
    if (playing && musicId != null) return v.playingSince == null ? { visit: { ...v, playingSince: at } } : s;
    if (v.playingSince == null) return s;
    return { visit: { ...v, accruedMs: v.accruedMs + Math.max(0, at - v.playingSince), playingSince: null } };
  }),
  stintMs: (musicId) => {
    const v = get().visit;
    return v?.musicId === musicId ? v.accruedMs + (v.playingSince == null ? 0 : Math.max(0, Date.now() - v.playingSince)) : 0;
  },
  hear: (musicId, source) => {
    const s = get();
    const unplayable = new Set(s.unplayable);
    unplayable.delete(musicId);
    const { flow, edge } = hearSong(source, musicId, s.flow, s.lastAudible, unplayable, createUuid);

    const owed = s.pending && !s.hasAnswered(s.pending.target) ? s.pending : null;
    const pending = owed ?? (edge && !s.hasAnswered(edge.target) ? edge : null);
    set({ flow, unplayable, lastAudible: musicId, pending, resolving: false, unansweredSent: false });
    settleQueued();
  },
  markUnplayable: (musicId) => set((s) => ({ unplayable: new Set(s.unplayable).add(musicId) })),
  setResolving: (resolving) => set({ resolving }),
  gate: (resume) => {
    const s = get();

    if (s.queued) return true;
    if (s.resolving || (s.historyLoading && s.pending)) { set({ queued: resume }); return true; }
    if (!s.pending || s.hasAnswered(s.pending.target)) return false;
    set({ prompt: s.pending, pending: null, queued: resume, submission: null, saving: false, saveError: false });
    return true;
  },
  close: () => {
    const resume = get().queued;
    set({ prompt: null, pending: null, queued: null, submission: null, saving: false, saveError: false });
    resume?.();
  },
  loadAnswered: (keys) => {
    const s = get();
    const answered = new Set([...s.answered, ...keys]);
    set({ answered, historyLoading: false });

    if (s.prompt && answered.has(questionKey(s.prompt.target)) && !s.submission) get().close();
    else settleQueued();
  },
  setHistoryLoading: (historyLoading) => { set({ historyLoading }); if (!historyLoading) settleQueued(); },
  hasAnswered: (target) => get().answered.has(questionKey(target)),
  beginSubmission: (row) => {
    const s = get();
    if (s.saving || !s.prompt || questionKey(s.prompt.target) !== questionKey(row)) return false;
    set({ submission: s.submission ?? row, saving: true, saveError: false });
    return true;
  },
  finishSubmission: (row, success) => {
    const s = get();
    if (s.submission !== row) return;
    if (!success) { set({ saving: false, saveError: true }); return; }
    set({ answered: new Set(s.answered).add(questionKey(row)) });
    get().close();
  },
  takeUnanswered: () => {
    const s = get();
    const edge = s.prompt ?? s.pending;
    if (!edge || s.submission || s.unansweredSent || s.hasAnswered(edge.target)) return null;

    set({ unansweredSent: true });
    return edge;
  },
  resumeAfterPagehide: () => {
    const s = get();
    if (!s.unansweredSent) return;

    const sessionId = createUuid();
    const renew = (edge: SurveyEdge | null) => edge ? { ...edge, target: { ...edge.target, sessionId } } : null;
    set({ pending: renew(s.pending), prompt: renew(s.prompt),
      flow: s.flow ? { ...s.flow, sessionId, slots: new Map() } : null });
  },
  resetListening: () => set({ ...listeningInitial, unplayable: new Set() }),
}));

function settleQueued(): void {
  const s = useSurveyStore.getState();
  if (!s.queued || s.prompt || s.resolving || s.historyLoading) return;
  if (s.pending && !s.hasAnswered(s.pending.target)) useSurveyStore.setState({ prompt: s.pending, pending: null });
  else s.close();
}
