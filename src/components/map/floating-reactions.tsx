"use client";

import { useMapStore } from "@/stores/use-map-store";
import { useReactionStore } from "@/stores/use-reaction-store";
import FloatingReactionItem from "./floating-reaction-item";

export default function FloatingReactions() {
  const floating = useReactionStore((s) => s.floating);

  const overlay = useMapStore((s) => s.viewMode) !== "default";
  if (overlay || floating.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floating.map((r) => (
        <FloatingReactionItem key={r.id} reaction={r} />
      ))}
    </div>
  );
}
