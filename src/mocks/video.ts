const DEMO_VIDEO_IDS = [
  "aqz-KE-bpKQ",
  "eRsGyueVLvQ",
  "R6MlUcmOul8",
  "WhWc3b3KhnY", // Spring (Blender Foundation)
];

export function mockVideoId(musicId: number, playable: boolean): string | null {
  if (!playable) return null;

  return DEMO_VIDEO_IDS[Math.abs(musicId) % DEMO_VIDEO_IDS.length];
}
