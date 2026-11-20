"use client";

import IconButton from "@/components/common/icon-button";
import { BackIcon } from "@/components/common/icons";
import { usePanelBack } from "@/hooks/use-panel-back";

export default function PanelBackButton() {
  const back = usePanelBack();
  if (!back) return null;
  return (
    <IconButton label={`${back.label}(으)로 돌아가기`} onClick={back.go}>
      <BackIcon />
    </IconButton>
  );
}
