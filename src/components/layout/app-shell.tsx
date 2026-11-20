"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import { APP_ROUTES } from "@/constants";
import BottomTabs from "./bottom-tabs";
import MainScreen from "./main-screen";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!APP_ROUTES.includes(pathname)) return children;

  return (
    <AuthGuard>
      <MainScreen />
      {children}
      <BottomTabs />
    </AuthGuard>
  );
}
