"use client";

import IconButton from "@/components/common/icon-button";
import { CloseIcon } from "@/components/common/icons";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants";
import { usePanelStore } from "@/stores/use-panel-store";

export default function PanelCloseButton() {
  const close = usePanelStore((s) => s.close);

  const pathname = usePathname();
  if (pathname !== ROUTES.home) return null;
  return (
    <IconButton label="패널 닫기" onClick={close} className="text-ink-2!">
      <CloseIcon />
    </IconButton>
  );
}
