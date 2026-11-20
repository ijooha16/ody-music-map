"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ROUTES } from "@/constants";

export function useBackToMap() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    if (pathname !== ROUTES.home) router.push(ROUTES.home);
  }, [pathname, router]);
}
