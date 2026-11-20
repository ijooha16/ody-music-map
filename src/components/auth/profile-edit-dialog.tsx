"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Box from "@/components/common/box";
import IconButton from "@/components/common/icon-button";
import { CloseIcon } from "@/components/common/icons";
import ProfileEditForm from "./profile-edit-form";

export default function ProfileEditDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay p-6 backdrop-blur-sm" onClick={onClose}>

      <div
        className="animate-tin w-full max-w-[380px]"
        role="dialog"
        aria-modal="true"
        aria-label="내 정보 수정"
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          title="내 정보 수정"
          actions={
            <IconButton label="닫기" onClick={onClose} className="text-ink-2!">
              <CloseIcon />
            </IconButton>
          }
        >
          <p className="text-[14px] text-ink-2">지도와 프로필에 보이는 모습이에요.</p>
          <ProfileEditForm onDone={onClose} />
        </Box>
      </div>
    </div>,
    document.body,
  );
}
