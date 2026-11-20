"use client";

import HelpButton from "@/components/layout/help-button";
import { useContestStore } from "@/stores/use-contest-store";
import AxisCompass from "./axis-compass";
import MinimapCanvas from "./minimap-canvas";

export default function MinimapPanel() {
  const contestOpen = useContestStore((s) => s.open);

  return (
    <aside
      data-hud

      className={`absolute bottom-hud-b left-[18px] z-20 w-instrument transition-transform duration-300 ease-out max-tablet:top-hud-t max-tablet:right-[68px] max-tablet:bottom-auto max-tablet:left-auto max-tablet:h-touch max-tablet:w-0 max-tablet:translate-x-0 max-tablet:[&>div[data-body]]:hidden ${
        contestOpen ? "translate-x-[calc(-100%_-_18px)]" : ""
      }`}
    >

      <div data-body className="relative">
        <MinimapCanvas />
        <AxisCompass />
        <HelpButton />
      </div>
    </aside>
  );
}
