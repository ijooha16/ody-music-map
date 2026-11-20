import type { VideoIdLookup } from "@/types";

const NOT_FOUND = "none";

export function videoIdLookup(item: { videoId: string | null } | undefined): VideoIdLookup {
  if (item == null) return "notFound";
  const raw = item.videoId;
  if (raw === NOT_FOUND || raw === "") return "notFound";
  return raw ? "found" : "unsearched";
}
