import type { ReactNode } from "react";

export default function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-ink-3 [&_b]:font-medium [&_b]:text-ink-2">{children}</p>;
}
