import Stat from "@/components/common/stat";
import type { ProfileDashboard } from "@/types";

export default function FeedDashboard({ dashboard }: { dashboard: ProfileDashboard }) {
  const rows = [
    { label: "탐험한 곡 (재생)", value: dashboard.exploredCount ?? 0 },
    { label: "발견한 곡 (처음 재생)", value: dashboard.discoveredCount ?? 0 },
  ];

  return (
    <dl className="m-0">
      {rows.map((r) => (
        <Stat key={r.label} label={r.label} value={`${r.value.toLocaleString()}곡`} numeric />
      ))}
    </dl>
  );
}
