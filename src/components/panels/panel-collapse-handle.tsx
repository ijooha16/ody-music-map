"use client";

import CollapseHandle from "@/components/common/collapse-handle";
import { usePanelStore } from "@/stores/use-panel-store";

export default function PanelCollapseHandle() {
  const collapsed = usePanelStore((s) => s.snap) === 1;
  const toggleCollapsed = usePanelStore((s) => s.toggleCollapsed);

  return (
    <CollapseHandle
      side="left"

      pointing={collapsed ? "left" : "right"}
      expanded={!collapsed}
      onClick={toggleCollapsed}
      title={collapsed ? "패널 펼치기" : "패널 접기"}

      hitClassName="max-tablet:hidden"
    />
  );
}
