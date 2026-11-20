export interface LayerResidency {
  layer: number;

  subset: ArrayLike<number>;
}

export function nearestLayerWith(frames: readonly LayerResidency[], songIndex: number): number | null {
  let best: number | null = null;
  for (const f of frames) {
    if (!f.subset[songIndex]) continue;
    if (best == null || f.layer > best) best = f.layer;
  }
  return best;
}
