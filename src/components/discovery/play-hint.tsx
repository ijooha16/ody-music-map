"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { useStarScreenPos } from "@/components/tutorial/tutorial-hint";
import TutorialSpotlight from "@/components/tutorial/tutorial-spotlight";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { BREAKPOINTS } from "@/constants/design-tokens";
import { track } from "@/lib/analytics/client";
import { readStorage, writeStorage } from "@/lib/storage";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";

type HintContext = "map" | "nearby" | "journey";

const LABEL: Record<HintContext, string> = {
  map: "별을 더블클릭하면 바로 재생돼요",
  nearby: "이웃 별도 더블클릭하면 바로 들려요",
  journey: "여정의 별도 더블클릭하면 바로 들려요",
};

const SETTLE_MS = 1600;

const HUD_TOP = 150;

const EDGE = 12;

const TIP_GAP = 46;

const seen = () => readStorage<HintContext[]>(STORAGE_KEYS.playHintSeen) ?? [];

function markSeen(context: HintContext) {
  const next = seen();
  if (next.includes(context)) return;
  writeStorage(STORAGE_KEYS.playHintSeen, [...next, context]);
}

function contextOf(viewMode: string): HintContext | null {
  if (viewMode === "nearby") return "nearby";
  if (viewMode === "constellation") return "journey";
  if (viewMode === "default") return "map";
  return null;
}

export default function PlayHint() {
  const pathname = usePathname();

  const narrow = useIsNarrow();
  const activePanel = usePanelStore((s) => s.activePanel);
  const panelSnap = usePanelStore((s) => s.snap);

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const viewMode = useMapStore((s) => s.viewMode);
  const context = contextOf(viewMode);

  const [settledFor, setSettledFor] = useState<HintContext | null>(null);

  const [dismissed, setDismissed] = useState<HintContext[]>([]);
  const [starId, setStarId] = useState<number | null>(null);

  const pending = hydrated && context != null && settledFor === context && !dismissed.includes(context);

  useEffect(() => {
    if (!hydrated || !context || seen().includes(context)) return;
    const id = window.setTimeout(() => setSettledFor(context), SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [hydrated, context]);

  useEffect(() => {
    if (!pending) return;
    let cur: number | null = null;
    const id = window.setInterval(() => {
      const e = getMapEngine();
      if (!e || (cur != null && e.starPos(cur))) return;
      cur = e.pickTutorialStar(HUD_TOP);
      setStarId(cur);
    }, 300);
    return () => window.clearInterval(id);
  }, [pending]);

  const at = useStarScreenPos(pending ? starId : null);

  useEffect(() => {
    if (!pending || !context) return;
    track("play_hint_shown", { context });
  }, [pending, context]);

  useEffect(() => {
    if (!pending || !context) return;
    const from = usePlayerStore.getState().playSeq;
    return usePlayerStore.subscribe((s) => {
      if (s.playSeq === from) return;
      track("play_hint_done", { context, result: "played" });
      markSeen(context);
      setDismissed((d) => (d.includes(context) ? d : [...d, context]));
    });
  }, [pending, context]);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  const bottomLimit = (left: number, right: number) => {
    const limit = window.innerHeight - EDGE;

    if (window.innerWidth >= BREAKPOINTS.tablet) return limit;
    let bounded = limit;
    for (const el of document.querySelectorAll("[data-hud]")) {
      const r = el.getBoundingClientRect();

      if (r.height > 0 && r.top > window.innerHeight / 2 && r.right > left && r.left < right) {
        bounded = Math.min(bounded, r.top - EDGE);
      }
    }
    return bounded;
  };

  const tip = (() => {
    if (!at) return { x: 0, y: 0 };
    if (!size.w) return { x: at.x, y: at.y + TIP_GAP };
    const half = size.w / 2;
    const x = Math.min(Math.max(at.x - half, EDGE), window.innerWidth - size.w - EDGE);

    const below = at.y + TIP_GAP;
    const y = below + size.h > bottomLimit(x, x + size.w) ? at.y - TIP_GAP - size.h : below;
    return { x, y };
  })();

  const skip = () => {
    if (!context) return;
    track("play_hint_done", { context, result: "skipped" });
    markSeen(context);
    setDismissed((d) => (d.includes(context) ? d : [...d, context]));
  };

  if (pathname !== ROUTES.home) return null;

  if (narrow && activePanel != null && panelSnap > 1) return null;
  if (!pending || !context || !at) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[55]">

      <TutorialSpotlight spotlight={[]} />

      <i className="fixed block h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-[radial-gradient(circle,rgba(79,227,206,.45)_0%,transparent_65%)]" style={{ left: at.x, top: at.y }} />
      <i className="animate-tbeat fixed block h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-teal" style={{ left: at.x, top: at.y }} />
      <i className="animate-tstar fixed block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-white shadow-[0_0_18px_6px_rgba(79,227,206,.9)]" style={{ left: at.x, top: at.y }} />

      <div className="animate-tin fixed" style={{ left: tip.x, top: tip.y }}>
        <div ref={measure} className="glass-liquid flex items-center gap-2 rounded-pill px-3 py-1.5 whitespace-nowrap">
          <span className="text-center text-[14.5px] text-ink">{LABEL[context]}</span>

          <button type="button" onClick={skip} className="pointer-events-auto cursor-pointer">
            <span className="text-[13.5px] text-ink-3 transition-colors hover:text-ink">건너뛰기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
