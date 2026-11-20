"use client";

import Avatar from "@/components/common/avatar";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { usePanelStore } from "@/stores/use-panel-store";

export default function ProfileButton() {
  const { data: me } = useMeQuery();
  const active = usePanelStore((s) => s.activePanel) === "feed";
  const toggle = usePanelStore((s) => s.toggle);
  return (
    <button
      type="button"
      title="내 프로필"
      aria-label="내 프로필"
      aria-pressed={active}
      data-tutorial="feed"
      onClick={() => toggle("feed")}
      className={`glass-liquid grid h-11 w-11 place-items-center rounded-pill! transition-colors duration-fast hover:border-line-2 ${active ? "border-teal/60! shadow-glow-azure" : ""}`}
    >
      <Avatar src={me?.imageUrl} name={me?.nickname ?? me?.name} size={32} />
    </button>
  );
}
