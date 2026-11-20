const DEFAULT_GOOGLE_CLIENT_ID = "602769818964-nt9s5tgu7u89cdvq7t0couihdf6floab.apps.googleusercontent.com";

export function resolveGoogleClientId(fromEnv: string | undefined): string {
  return fromEnv || DEFAULT_GOOGLE_CLIENT_ID;
}

export const GOOGLE_CLIENT_ID = resolveGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
