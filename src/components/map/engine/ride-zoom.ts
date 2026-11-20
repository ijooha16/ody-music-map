export type WheelIntent = "dig" | "rise" | "zoom";

export function wheelIntent(input: { zoomIn: boolean; gateOpen: boolean; zoomedOutEnough: boolean; hasStack: boolean }): WheelIntent {
  if (input.zoomIn) return input.gateOpen ? "dig" : "zoom";
  return input.hasStack && input.zoomedOutEnough ? "rise" : "zoom";
}
