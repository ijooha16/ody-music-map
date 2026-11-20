export interface FollowKey {
  email: string;
  layer: number;
}

export function shouldRestartFollow(current: FollowKey | null, next: FollowKey): boolean {
  if (!current) return true;
  return current.email !== next.email || current.layer !== next.layer;
}
