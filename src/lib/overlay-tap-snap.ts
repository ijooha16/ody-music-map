import type { MapViewMode } from "@/constants/panel";
import type { SheetSnap } from "@/stores/use-panel-store";

export function overlayTapSnap(o: { narrow: boolean; viewMode: MapViewMode; activePanel: string | null; snap: SheetSnap }): SheetSnap | undefined {
  if (!o.narrow || (o.viewMode !== "nearby" && o.viewMode !== "constellation")) return undefined;
  return o.activePanel ? o.snap : 1;
}
