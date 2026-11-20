"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";
import Box from "./box";
import IconButton from "./icon-button";

interface CenterDialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;

  flush?: boolean;
}

export default function CenterDialog({ title, onClose, children, flush = false }: CenterDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-overlay p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div className="w-full max-w-sm animate-tin" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <Box
          title={title}
          flush={flush}
          actions={
            <IconButton label="닫기" onClick={onClose} className="text-ink-2!">
              <CloseIcon />
            </IconButton>
          }
        >
          {children}
        </Box>
      </div>
    </div>,
    document.body,
  );
}
