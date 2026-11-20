export function seedOf(email: string): number[] {
  let h = 2166136261;
  for (const ch of email) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0;
  return Array.from({ length: 6 }, (_, i) => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return ((h >>> (i % 8)) % 1000) / 1000;
  });
}
