export interface SurveyPersistenceContext {
  backendEnabled: boolean;
  hostname: string;
  localTestDatabase: boolean;
}

export function isLoopbackBackend(origin?: string): boolean {
  if (!origin) return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function shouldPersistSurvey(context: SurveyPersistenceContext): boolean {
  if (!context.backendEnabled) return false;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(context.hostname);
  return local ? context.localTestDatabase : true;
}
