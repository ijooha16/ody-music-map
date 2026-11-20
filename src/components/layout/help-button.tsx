"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { HelpIcon } from "@/components/common/icons";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { usePanelStore } from "@/stores/use-panel-store";
import HelpDialog from "./help-dialog";
import { setAnalyticsContext, track } from "@/lib/analytics/client";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  const narrow = useIsNarrow();
  const activePanel = usePanelStore((s) => s.activePanel);

  const snap = usePanelStore((s) => s.snap);
  const sheetUp = activePanel != null && snap > 1;
  const close = () => {
    track("help_closed");
    setAnalyticsContext({ help_open: false });
    setOpen(false);
  };
  if (narrow && sheetUp) return null;
  return (
    <>
      <button data-hud data-analytics-manual
        type="button"
        aria-label="도움말"
        title="도움말"
        onClick={() => { track("help_opened"); setAnalyticsContext({ help_open: true }); setOpen(true); }}

        className="glass-liquid absolute -top-10 left-0 z-[22] grid h-8 w-8 place-items-center rounded-pill! text-ink-2 transition-colors hover:text-ink max-tablet:hidden"
      >
        <HelpIcon />
      </button>
      {open && createPortal(<HelpDialog onClose={close} />, document.body)}
    </>
  );
}
