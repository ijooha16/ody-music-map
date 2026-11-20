import { LAYER_COUNT } from "@/constants/map";

export function rideLayerTarget(current: number, fromServer: number | null | undefined): number | null {
  if (fromServer == null || !Number.isInteger(fromServer)) return null;
  if (fromServer < 0 || fromServer >= LAYER_COUNT) return null;
  return fromServer === current ? null : fromServer;
}
