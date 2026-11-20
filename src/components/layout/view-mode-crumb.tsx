"use client";

import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";

export default function ViewModeCrumb() {
  const viewMode = useMapStore((s) => s.viewMode);
  const exitNearby = useMapStore((s) => s.exitNearby);
  const toggleConstellation = useMapStore((s) => s.toggleConstellationView);
  const ids = useMapStore((s) => s.constellationMusicIds);
  const source = useMapStore((s) => s.constellationSource);
  const openJourney = usePanelStore((s) => s.openJourney);
  const openPlaylist = usePanelStore((s) => s.openPlaylist);
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);

  const riding = useFollowStore((s) => s.leaderEmail != null);

  const nearby = viewMode === "nearby";
  const constellation = viewMode === "constellation";

  const canOpen = ids.length >= 2;

  const cursor = currentMusicId == null ? -1 : ids.indexOf(currentMusicId);
  const count = cursor >= 0 ? `${cursor + 1}/${ids.length}` : `${ids.length}곡`;

  const label = nearby ? "주변 탐색 뷰" : "별자리 뷰";
  const on = nearby || constellation;
  const dot = nearby ? "bg-teal shadow-[0_0_8px_#4fe3ce]" : constellation ? "bg-violet shadow-[0_0_8px_#a67cff]" : "bg-violet/40";
  const tone = nearby ? "border-teal/40 text-ink shadow-glow-teal" : constellation ? "border-violet/45 text-ink shadow-glow-violet" : "text-ink-2";

  const openConstellation = () => {
    if (!canOpen) return;
    toggleConstellation();
    if (source?.kind === "journey") openJourney();
    else if (source?.kind === "playlist") openPlaylist(source.playlistId);
  };

  const turnOff = nearby ? exitNearby : toggleConstellation;

  const press = riding ? null : on ? turnOff : canOpen ? openConstellation : null;
  const hint = riding ? "따라가는 동안은 인솔자의 화면을 같이 봐요" : on ? `${label} 끄기` : press ? "별자리 뷰 켜기" : undefined;

  if (!on && !canOpen) return null;

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-1">
      <span

        data-glass-clear
        className={`glass group inline-flex items-center gap-1.5 rounded-pill! px-2.5 py-[5px] text-[13.5px] transition-colors duration-fast ${tone} ${
          press ? "cursor-pointer hover:border-line-2 hover:text-ink" : ""
        }`}
        onClick={press ?? undefined}
        role={press ? "button" : undefined}
        tabIndex={press ? 0 : undefined}
        onKeyDown={press ? (e) => (e.key === "Enter" || e.key === " ") && press() : undefined}
        title={hint}
        aria-label={hint}
      >
        <span className={`h-1 w-1 rounded-pill ${dot}`} />
        {label}

        {(constellation || !on) && <span className="num text-ink-3">{count}</span>}

        {on && !riding && <span aria-hidden className="ml-0.5 text-ink-3 transition-colors group-hover:text-ink">✕</span>}
      </span>
    </div>
  );
}
