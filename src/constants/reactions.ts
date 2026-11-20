export const REACTIONS = [
  { key: "rocket", emoji: "🚀", label: "출발" },
  { key: "fire", emoji: "🔥", label: "불" },
  { key: "heart", emoji: "💓", label: "하트" },
  { key: "poop", emoji: "💩", label: "응" },
  { key: "pray", emoji: "🙏", label: "기도" },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]["key"];

export const emojiOf = (key: string) => REACTIONS.find((r) => r.key === key)?.emoji ?? "✨";

export const REACTION_VISIBLE_MS = 2_000;
