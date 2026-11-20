"use client";

import { useMemo, useState } from "react";
import { coverFor } from "@/components/map/render/sprites";
import Box from "@/components/common/box";
import Button from "@/components/common/button";
import { NO_GENRE_ID } from "@/constants/map";
import { SURVEY_TARGET_LABEL, SURVEYS } from "@/constants/survey";
import { useSurveySubmit } from "@/hooks/survey/use-survey-submit";
import { buildSubmission } from "@/hooks/survey/submission";
import { usePlayerStore } from "@/stores/use-player-store";
import { useSurveyStore } from "@/stores/use-survey-store";
import { questionKey, type SurveyReason, type SurveySong } from "@/types/survey";

const SELECTED_CLASS = "bg-violet/25! border-violet! text-white! shadow-glow-violet";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReplayIcon({ sounding }: { sounding: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5 shrink-0" fill="currentColor">
      {sounding ? <path d="M3 6h2.5L9 3v10L5.5 10H3zM11 5.5a3.5 3.5 0 0 1 0 5v-1.4a2.2 2.2 0 0 0 0-2.2z" /> : <path d="M5 3.5l7 4.5-7 4.5z" />}
    </svg>
  );
}

function SurveySongRow({
  label,
  song,
  highlight = false,
}: {
  label: string;
  song: SurveySong;
  highlight?: boolean;
}) {
  const preview = usePlayerStore((s) => s.preview);
  const sounding = usePlayerStore((s) => s.currentMusicId) === song.musicId;
  const unplayable = useSurveyStore((s) => s.unplayable).has(song.musicId);

  const cover = useMemo(
    () =>
      coverFor({
        musicId: song.musicId,
        genreId: song.genreId ?? NO_GENRE_ID,
        pc: [],
        weight: 1,
        title: "",
        artist: null,
        youtubeUrl: null,
        playable: true,
      }).toDataURL(),
    [song.musicId, song.genreId],
  );
  const size = highlight ? 46 : 38;

  return (
    <div className="flex flex-col gap-1.5">

      <span className={`text-[14.5px] leading-none font-semibold ${highlight ? "text-violet" : "text-ink-3"}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="shrink-0 rounded-box-xs border border-line bg-cover"
          style={{ width: size, height: size, backgroundImage: `url(${cover})` }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={
              highlight
                ? "font-display text-[18px] leading-tight font-semibold break-keep text-ink"
                : "text-[17px] leading-tight break-keep text-ink-2"
            }
          >
            {song.title}
          </p>
          <p className={`mt-1 truncate text-[15px] ${highlight ? "text-ink-2" : "text-ink-3"}`}>{song.artist ?? "Unknown"}</p>
        </div>
        <button
          type="button"
          onClick={() => preview(song.musicId)}
          disabled={unplayable}
          aria-label={`${song.title} 다시 듣기`}
          className="flex shrink-0 items-center gap-1 rounded-pill border border-line px-2.5 py-1.5 text-[13.5px] text-ink-2 transition hover:border-violet hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2"
        >
          <ReplayIcon sounding={sounding} />
          {unplayable ? "재생 불가" : sounding ? "재생 중" : "다시 듣기"}
        </button>
      </div>
    </div>
  );
}

export default function SurveyCard() {
  const prompt = useSurveyStore((s) => s.prompt);
  const stintMs = useSurveyStore((s) => s.stintMs);
  const close = useSurveyStore((s) => s.close);
  const saving = useSurveyStore((s) => s.saving);
  const saveError = useSurveyStore((s) => s.saveError);
  const submission = useSurveyStore((s) => s.submission);
  const waiting = useSurveyStore((s) => s.queued != null && s.prompt == null);
  const submit = useSurveySubmit();

  const [state, setState] = useState<{ key: string; verdict: boolean | null; reason: SurveyReason | null }>({
    key: "",
    verdict: null,
    reason: null,
  });

  const key = prompt ? `${prompt.target.sessionId}:${questionKey(prompt.target)}` : "";
  if (state.key !== key) setState({ key, verdict: null, reason: null });

  if (!prompt) return waiting ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay" role="status">
      <Box title="잠깐만요">탐색 결과와 이전 설문 응답을 확인하고 있어요…</Box>
    </div>
  ) : null;
  const target = prompt.target;
  const definition = SURVEYS[target.mode];

  const send = (verdict: boolean, reason: SurveyReason | null) => {
    const row = submission ?? buildSubmission({ target, verdict, reason, listenedMs: stintMs(target.musicId), skipped: false, durationSec: prompt.subject.durationSec });
    if (!useSurveyStore.getState().beginSubmission(row)) return;
    setState((s) => ({ ...s, verdict: row.verdict, reason: row.reason }));
    submit.mutate(row);
  };

  const askingReason = state.verdict === false;

  return (
    <div data-analytics-manual className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="w-full max-w-md animate-tin" role="dialog" aria-modal="true" aria-label="설문">
        <Box title="잠깐만요">

          <div className="flex flex-col gap-2 rounded-box-xs border border-line bg-void-3/50 px-3 py-2.5">
            <SurveySongRow label={definition.compareLabel} song={prompt.compare} />
            <div className="h-px bg-line" />
            <SurveySongRow label={SURVEY_TARGET_LABEL} song={prompt.subject} highlight />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-base leading-relaxed font-medium text-ink">{definition.question}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="md" disabled={submission != null} aria-pressed={state.verdict === true} className={state.verdict === true ? SELECTED_CLASS : ""} onClick={() => send(true, null)}>
                {definition.yes}
              </Button>
              <Button
                size="md"
                disabled={submission != null}
                aria-pressed={askingReason}
                className={askingReason ? SELECTED_CLASS : ""}
                onClick={() => setState((s) => ({ ...s, verdict: false }))}
              >
                {askingReason && <CheckIcon />}
                아니요
              </Button>
            </div>
          </div>

          {askingReason && (
            <div className="flex flex-col gap-2">
              <p className="text-base leading-relaxed font-medium text-ink">{definition.reasonQuestion}</p>
              <div className="flex flex-wrap gap-2">
                {definition.reasons.map((r) => (
                  <Button
                    key={r.value}
                    size="md"
                    disabled={submission != null}
                    aria-pressed={state.reason === r.value}
                    className={state.reason === r.value ? SELECTED_CLASS : ""}
                    onClick={() => setState((s) => ({ ...s, reason: r.value }))}
                  >
                    {state.reason === r.value && <CheckIcon />}
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">

                <span className="text-[14.5px] text-ink-3">이유를 하나 골라주세요</span>
                <Button variant="primary" size="md" disabled={state.reason == null || submission != null} onClick={() => send(false, state.reason)}>
                  제출
                </Button>
              </div>
            </div>
          )}
          {saving && <p role="status" className="text-sm text-ink-2">저장 중이에요. 완료되면 다음 곡이 나와요.</p>}
          {saveError && (
            <div className="flex flex-col gap-2" role="alert">
              <p className="text-sm text-ink-2">저장을 확인하지 못했어요. 고른 답은 유지돼 있어요. 다시 시도하거나 저장 확인 없이 계속 들을 수 있어요.</p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => send(submission!.verdict!, submission!.reason)}>다시 시도</Button>
                <Button onClick={close}>저장하지 않고 계속 듣기</Button>
              </div>
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
