"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Box from "@/components/common/box";
import EmptyState from "@/components/common/empty-state";
import ErrorMessage from "@/components/common/error-message";
import IconButton from "@/components/common/icon-button";
import { CloseIcon } from "@/components/common/icons";
import SkeletonRows from "@/components/common/skeleton-rows";
import UnderlineTabs from "@/components/common/underline-tabs";
import { CONTEST_TABS } from "@/constants";
import { useContestCurrentQuery } from "@/hooks/queries/use-contest-current-query";
import { useContestStore } from "@/stores/use-contest-store";
import ContestHeader from "./contest-header";
import GalleryTab from "./gallery-tab";
import RankingTab from "./ranking-tab";
import SketchTab from "./sketch-tab";

export default function ContestModal() {
  const open = useContestStore((s) => s.open);
  const close = useContestStore((s) => s.close);
  const tab = useContestStore((s) => s.tab);
  const setTab = useContestStore((s) => s.setTab);
  const { data: contest, isPending, isError } = useContestCurrentQuery();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6 backdrop-blur-sm max-tablet:p-0" onClick={close} role="presentation">
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="이벤트 · 별자리 콘테스트"
        className="animate-tin flex h-[min(820px,100%)] w-[min(1120px,100%)] flex-col max-tablet:h-full max-tablet:w-full [&>section]:h-full max-tablet:[&>section]:rounded-none!"
      >
        <Box
          title={
            <span className="flex items-baseline gap-2">
              이벤트
              <span className="lbl">별자리 콘테스트</span>
            </span>
          }
          actions={
            <IconButton label="닫기" onClick={close}>
              <CloseIcon />
            </IconButton>
          }
        >
          {isPending && <SkeletonRows count={4} thumb="none" />}
          {isError && <ErrorMessage />}
          {contest === null && <EmptyState message="지금 진행 중인 이벤트가 없어요. 다음 회차를 기다려 주세요." />}
          {contest && (
            <>
              <ContestHeader contest={contest} />
              <UnderlineTabs items={CONTEST_TABS} value={tab} onChange={setTab} />

              {tab === "sketch" && <SketchTab contest={contest} />}
              {tab === "gallery" && <GalleryTab contest={contest} />}
              {tab === "ranking" && <RankingTab contest={contest} />}
            </>
          )}
        </Box>
      </div>
    </div>,
    document.body,
  );
}
