"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import CenterDialog from "@/components/common/center-dialog";
import type { ContestEntry } from "@/types";

export default function DrawNewButton({ entry, onConfirm }: { entry: ContestEntry; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setAsking(true)}>
        새로 그리기
      </Button>
      {asking && (
        <CenterDialog title="새로 그릴까요" onClose={() => setAsking(false)}>
          <p className="text-sm leading-relaxed text-ink-2">
            회차당 작품은 1개예요. 새로 출품하면 「{entry.title}」은 지워지고 <b className="text-ink">AI 점수와 좋아요가 초기화</b>돼요. 새로 그리기만 해서는 아무것도 바뀌지 않아요.
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setAsking(false)}>
              취소
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setAsking(false);
                onConfirm();
              }}
            >
              새로 그리기
            </Button>
          </div>
        </CenterDialog>
      )}
    </>
  );
}
