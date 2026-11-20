"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Logo from "@/components/common/logo";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { DEMO_TOKEN, PUBLIC_DEMO } from "@/constants/public-demo";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { useForcePublic } from "@/hooks/use-force-public";
import { readStorage, resyncStorage, subscribeStorage, writeStorage } from "@/lib/storage";

function useResyncToken(hasToken: boolean): void {
  useEffect(() => {
    if (hasToken !== !!readStorage<string>(STORAGE_KEYS.accessToken)) resyncStorage();
  }, [hasToken]);
}

function useHasToken() {
  return useSyncExternalStore(
    subscribeStorage,
    () => !!readStorage<string>(STORAGE_KEYS.accessToken),
    () => false,
  );
}

function Splash() {
  return (
    <main className="stage-bg fixed inset-0 flex items-center justify-center">
      <Logo size={56} radius={20} className="animate-pulse-dot shadow-[0_0_36px_-6px_rgba(92,157,255,.8)]" />
    </main>
  );
}

export default function AuthGuard({ children, requireNickname = true }: { children: ReactNode; requireNickname?: boolean }) {
  const router = useRouter();
  const hasToken = useHasToken();
  useResyncToken(hasToken);
  const { data: me } = useMeQuery();
  const needsNickname = requireNickname && !!me && !me.nickname;

  useForcePublic(!!me);

  useEffect(() => {
    if (PUBLIC_DEMO && !readStorage<string>(STORAGE_KEYS.accessToken)) writeStorage(STORAGE_KEYS.accessToken, DEMO_TOKEN);
    if (!readStorage<string>(STORAGE_KEYS.accessToken)) router.replace(ROUTES.login);
    else if (needsNickname) router.replace(ROUTES.nickname);
  }, [hasToken, needsNickname, router]);

  if (!hasToken || needsNickname) return <Splash />;
  return <>{children}</>;
}

export function GuestGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasToken = useHasToken();
  useResyncToken(hasToken);

  useEffect(() => {
    if (PUBLIC_DEMO) writeStorage(STORAGE_KEYS.accessToken, DEMO_TOKEN);
    if (readStorage<string>(STORAGE_KEYS.accessToken)) router.replace(ROUTES.home);
  }, [hasToken, router]);

  if (hasToken) return <Splash />;
  return <>{children}</>;
}
