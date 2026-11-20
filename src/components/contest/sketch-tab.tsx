"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import GuardedButton from "@/components/common/guarded-button";
import { ChevronLeftIcon } from "@/components/common/icons";
import { CONTEST_ARTWORK_THUMB_PX, SKETCH_RULES } from "@/constants";
import { useContestMatchMutation } from "@/hooks/mutations/use-contest-match-mutation";
import { useContestMineQuery } from "@/hooks/queries/use-contest-mine-query";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { useContestSubmit } from "@/hooks/use-contest-submit";
import { backStep, myEntry, roundPhase, visibleStep } from "@/lib/contest-view";
import { useContestStore } from "@/stores/use-contest-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { Contest } from "@/types";
import ConstellationThumb from "./constellation-thumb";
import DrawNewButton from "./draw-new-button";
import MatchResult from "./match-result";
import MyWorkView from "./my-work-view";
import SketchCanvas from "./sketch-canvas";
import SketchSteps from "./sketch-steps";
import SubmitForm from "./submit-form";
import TemplatePicker from "./template-picker";

export default function SketchTab({ contest }: { contest: Contest }) {
  const points = useContestStore((s) => s.points);
  const closed = useContestStore((s) => s.closed);
  const match = useContestStore((s) => s.match);
  const step = useContestStore((s) => s.step);
  const setStep = useContestStore((s) => s.setStep);
  const addPoint = useContestStore((s) => s.addPoint);
  const removePoint = useContestStore((s) => s.removePoint);
  const undo = useContestStore((s) => s.undo);
  const clear = useContestStore((s) => s.clear);
  const toggleClosed = useContestStore((s) => s.toggleClosed);
  const setMatch = useContestStore((s) => s.setMatch);
  const toast = useToastStore((s) => s.show);
  const matchMut = useContestMatchMutation();
  const { data: me } = useMeQuery();
  const mineQuery = useContestMineQuery(!!me);
  const my = myEntry(mineQuery.data);
  const open = roundPhase(contest) === "OPEN";

  const [hovered, setHovered] = useState<number | null>(null);
  const submitter = useContestSubmit({ contest, match, my, loggedIn: !!me, onSubmitted: () => setStep("scoring") });

  const decided = useRef(false);
  const mineReady = !me || mineQuery.isFetched;
  useEffect(() => {
    if (decided.current || !mineReady) return;
    decided.current = true;
    if (my && points.length === 0 && !match) setStep("scoring");
  }, [mineReady, my, points.length, match, setStep]);

  const current = visibleStep(step, { hasMine: my != null, hasMatch: match != null, mineScored: my?.status === "SCORED" });
  const back = backStep(current);

  const { minPoints, maxPoints } = SKETCH_RULES;
  const count = points.length;

  const handleAdd = (p: Parameters<typeof addPoint>[0]) => {
    if (count >= maxPoints) return toast(`점은 ${maxPoints}개까지 찍을 수 있어요`);
    addPoint(p);
  };

  const findStars = () => {
    if (match) return setStep("review");
    matchMut.mutate(points, {
      onSuccess: (m) => {
        setMatch(m);
        setStep("review");
      },
      onError: (e) => toast(e.message),
    });
  };

  const currentEntryLine = my ? (
    <p className="text-xs text-ink-3">
      현재 출품작 「{my.title}」{my.status === "SCORED" && my.score != null ? ` · AI ${my.score}점` : my.status === "PENDING" ? " · 채점 중" : ""} — 새로 내면 교체돼요
    </p>
  ) : null;

  let body: ReactNode = null;
  let action: ReactNode = null;
  if (current === "draw") {
    body = (
      <div className="flex h-full min-h-0 flex-col gap-2">

        <div className="flex flex-wrap items-center gap-1.5">
          <TemplatePicker loggedIn={!!me} theme={contest.theme} onPicked={() => setStep("review")} />
          <Button size="sm" onClick={undo} disabled={!count}>
            한 점 되돌리기
          </Button>
          <Button size="sm" variant="ghost" onClick={clear} disabled={!count && !match}>
            전체 지우기
          </Button>
          <span className="num ml-auto text-xs text-ink-3">
            점 {count} / {maxPoints}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 gap-5">

          <div className="aspect-square h-full max-h-full min-h-0 shrink-0">
            <SketchCanvas points={points} closed={closed} result={null} onAdd={handleAdd} onRemove={removePoint} onToggleClose={toggleClosed} />
          </div>
          <div className="flex min-w-0 flex-col gap-3 pt-1 text-sm leading-relaxed text-ink-2">
            <p className="text-base text-ink">
              <b>{contest.theme}</b> 모양을 점으로 그려 보세요
            </p>
            <p>빈 곳을 누르면 점이 붙고, 찍힌 점을 다시 누르면 빠져요. 찍은 순서대로 이어지고 {minPoints}~{maxPoints}개까지 찍을 수 있어요.</p>
            <p>첫 점을 다시 누르면 마지막 점과 이어져 닫힌 모양이 돼요.</p>
            <p>다음을 누르면 그린 모양과 닮은 배치의 곡을 별밭에서 찾아 별자리로 이어 줘요. 막막하면 ✨ AI 추천 모양으로 시작해 보세요.</p>
          </div>
        </div>
      </div>
    );
    action = (
      <GuardedButton size="sm" variant="primary" blocked={!match && count < minPoints ? `점을 ${minPoints}개 이상 찍어 주세요 · 지금 ${count}개` : null} disabled={matchMut.isPending} onClick={findStars}>
        {matchMut.isPending ? "별을 찾는 중..." : "다음 ›"}
      </GuardedButton>
    );
  } else if (current === "review" && match) {
    body = (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-1">
            <div className="mx-auto aspect-square h-full max-h-full max-w-full">
              <SketchCanvas points={points} closed={closed} result={match.tracks} onAdd={() => {}} onRemove={() => {}} highlight={hovered} readOnly />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-ink-2">
            {match.template
              ? `AI 추천 「${match.template.label}」 모양대로 고른 곡이에요. 플레이리스트 「${match.template.playlistName}」은 이미 만들어졌고, 출품하면 다음 단계에서 지은 이름으로 바뀌어요.`
              : "점을 찍은 순서대로 한 점에 한 곡씩 골랐어요 — 목록 번호가 별 번호예요. 출품하면 이 곡들로 플레이리스트가 만들어져요."}
            {!match.template && match.quality === "LOW" && " 그린 모양과 꽤 달라요. 뒤로 가서 점을 고쳐 다시 찾을 수 있어요."}
          </p>
          {currentEntryLine}
        </div>
        <MatchResult match={match} className="min-h-0" onHover={setHovered} showNote={false} />
      </div>
    );
    action = (
      <Button size="sm" variant="primary" onClick={() => setStep("submit")}>
        다음 ›
      </Button>
    );
  } else if (current === "submit" && match) {
    body = (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-5">
        <ConstellationThumb tracks={match.tracks} closed={closed} size={CONTEST_ARTWORK_THUMB_PX} className="border border-line" />
        <div className="w-full">
          <SubmitForm contest={contest} match={match} my={my} onSubmit={submitter.submit} />
        </div>
      </div>
    );
    action = (
      <GuardedButton size="sm" variant="primary" blocked={submitter.blocked} disabled={submitter.pending} onClick={submitter.submit}>
        {submitter.pending ? "출품하는 중..." : `${submitter.label} ›`}
      </GuardedButton>
    );
  } else if ((current === "scoring" || current === "done") && my) {
    body = <MyWorkView entry={my} contest={contest} note={current === "done" ? "채점이 끝났어요. 갤러리와 순위에서 다른 별자리와 함께 볼 수 있어요." : null} />;
    if (open) action = <DrawNewButton entry={my} onConfirm={() => setStep("draw")} />;
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)] gap-6">
      <aside className="border-r border-line pr-4">
        <SketchSteps current={current} />
      </aside>
      <section className="flex min-h-0 flex-col gap-3">

        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto">{body}</div>

        <div className="flex min-h-9 items-center justify-end gap-2">
          {back && (
            <Button size="sm" variant="ghost" onClick={() => setStep(back)}>
              <ChevronLeftIcon /> 뒤로
            </Button>
          )}
          {action}
        </div>
      </section>
    </div>
  );
}
