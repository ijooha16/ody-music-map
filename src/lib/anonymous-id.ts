import { SURVEY_ANON_KEY } from "@/constants/survey";
import { createUuid } from "@/lib/uuid";
let memoryId: string | undefined;

export function getAnonymousId(): string {
  if (typeof window === "undefined") return createUuid();

  try {
    const saved = localStorage.getItem(SURVEY_ANON_KEY);
    if (saved) return saved;
    const created = memoryId ??= createUuid();
    localStorage.setItem(SURVEY_ANON_KEY, created);
    return created;
  } catch {
    return memoryId ??= createUuid();
  }
}
