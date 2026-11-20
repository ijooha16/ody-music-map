"use client";

import PlayerBar from "./player-bar";
import YoutubeEmbed from "./youtube-embed";

export default function BottomBar() {
  return (
    <>
      <YoutubeEmbed />
      <footer
        data-hud

        className="absolute right-[18px] bottom-hud-b z-[21] flex w-right-panel items-stretch max-tablet:right-0 max-tablet:bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)-var(--radius-sheet))] max-tablet:left-0 max-tablet:w-auto"
      >
        <PlayerBar />
      </footer>
    </>
  );
}
