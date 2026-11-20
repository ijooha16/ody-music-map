export function acceptsAnchor(travelingTo: number | null, incoming: number): boolean {
  return travelingTo == null || travelingTo === incoming;
}
