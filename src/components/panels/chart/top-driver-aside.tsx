"use client";

import { useEffect, useRef, useState } from "react";
import IconButton from "@/components/common/icon-button";
import { RefreshIcon } from "@/components/common/icons";
import { TOP_DRIVER } from "@/constants";
import { formatTimeAgo } from "@/lib/format";

interface TopDriverAsideProps {
  updatedAt: number;

  fetching: boolean;
  onRefresh: () => void;
}

export default function TopDriverAside({ updatedAt, fetching, onRefresh }: TopDriverAsideProps) {
  const [now, setNow] = useState(() => Date.now());
  const [cooling, setCooling] = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TOP_DRIVER.agoTickMs);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    if (cooldown.current) clearTimeout(cooldown.current);
  }, []);

  const refresh = () => {
    setCooling(true);
    onRefresh();
    cooldown.current = setTimeout(() => setCooling(false), TOP_DRIVER.refreshCooldownMs);
  };

  return (
    <span className="flex items-center gap-1">
      {updatedAt > 0 && <span>{formatTimeAgo(new Date(updatedAt).toISOString(), Math.max(now, updatedAt))}</span>}
      <IconButton label="새로고침" size={22} onClick={refresh} disabled={cooling || fetching} className="disabled:opacity-40 disabled:hover:bg-transparent">
        <RefreshIcon className={fetching ? "animate-spin" : undefined} />
      </IconButton>
    </span>
  );
}
