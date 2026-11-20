"use client";

import { useEffect, useRef, useState } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { emojiOf } from "@/constants";
import type { FloatingReaction } from "@/stores/use-reaction-store";

export default function FloatingReactionItem({ reaction }: { reaction: FloatingReaction }) {
  const ref = useRef<HTMLDivElement>(null);
  const emoji = emojiOf(reaction.reactionKey);
  const [mapNickname] = useState(() => (reaction.fromEmail ? (getMapEngine()?.friendNickname(reaction.fromEmail) ?? null) : null));
  const nickname = reaction.nickname ?? mapNickname;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const engine = getMapEngine();
        const p = reaction.mine ? engine?.mePos() : reaction.fromEmail ? engine?.friendScreenPos(reaction.fromEmail) : null;
        if (p) {
          el.style.opacity = "1";
          el.style.transform = `translate(${p.x}px, ${p.y - 18}px)`;
        } else {
          el.style.opacity = "0";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reaction.mine, reaction.fromEmail]);

  return (
    <div ref={ref} className="absolute top-0 left-0 opacity-0">
      <span className="animate-fly absolute bottom-0 left-0 flex flex-col items-center gap-0.5">
        <span className="text-[30px] leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,.6)]">{emoji}</span>
        {nickname && <span className="lbl whitespace-nowrap text-[9px] text-ink-2">{nickname}</span>}
      </span>
    </div>
  );
}
