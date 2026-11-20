"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Box from "@/components/common/box";
import Button from "@/components/common/button";
import IconButton from "@/components/common/icon-button";
import { CloseIcon } from "@/components/common/icons";
import Note from "@/components/common/note";
import {
  REPORT_DETAIL_MAX,
  REPORT_DETAIL_PLACEHOLDER,
  REPORT_FAILED_NOTICE,
  REPORT_NEEDS_DETAIL,
  reportReasonsFor,
  REPORT_SENT_NOTICE,
  type ReportReason,
} from "@/constants";
import { useReportMusicMutation } from "@/hooks/mutations/use-report-music-mutation";
import { useToastStore } from "@/stores/use-toast-store";

interface SongReportDialogProps {
  musicId: number;

  unplayable?: boolean;

  title: string;
  onClose: () => void;
}

export default function SongReportDialog({ musicId, title, unplayable = false, onClose }: SongReportDialogProps) {
  const report = useReportMusicMutation();
  const showToast = useToastStore((s) => s.show);

  const [detailFor, setDetailFor] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = (reason: ReportReason, detailReason?: string) => {
    report.mutate(
      { musicId, reason, detailReason },
      { onSuccess: () => showToast(REPORT_SENT_NOTICE), onError: () => showToast(REPORT_FAILED_NOTICE) },
    );
    onClose();
  };

  const pick = (reason: ReportReason) => (reason === REPORT_NEEDS_DETAIL ? setDetailFor(reason) : send(reason));

  const trimmed = detail.trim();
  const reasons = reportReasonsFor(unplayable);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={onClose}>

      <div
        className="w-full max-w-sm animate-tin"
        role="dialog"
        aria-modal="true"
        aria-label="곡 신고"
        onClick={(e) => e.stopPropagation()}
      >

        <Box
          title="이 곡을 신고할까요"
          actions={
            <IconButton label="닫기" onClick={onClose} className="text-ink-2!">
              <CloseIcon />
            </IconButton>
          }
        >
          <p className="truncate text-[15px] text-ink-2">{title}</p>
          {detailFor ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="lbl text-ink-3">어떤 점이 문제인가요</span>
                <textarea
                  autoFocus
                  rows={3}
                  value={detail}
                  maxLength={REPORT_DETAIL_MAX}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={REPORT_DETAIL_PLACEHOLDER}
                  className="w-full resize-none rounded-box border border-line bg-glass px-3 py-2 text-[15px] text-ink placeholder:text-ink-4 focus:border-teal focus:outline-none"
                />
              </label>
              <div className="flex gap-2">

                <Button size="sm" onClick={() => (setDetailFor(null), setDetail(""))}>
                  뒤로
                </Button>

                <Button variant="primary" size="sm" className="flex-1" disabled={!trimmed} onClick={() => send(detailFor, trimmed)}>
                  보내기
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {reasons.map((r) => (
                  <Button key={r.value} className="justify-start! text-left" onClick={() => pick(r.value)}>
                    <span className="font-medium">{r.label}</span>
                    <span className="ml-1.5 text-[13.5px] text-ink-3">{r.detail}</span>
                  </Button>
                ))}
              </div>
              <Note>보낸 신고는 이 곡의 데이터를 고치는 데만 씁니다.</Note>
            </>
          )}
        </Box>
      </div>
    </div>,
    document.body,
  );
}
