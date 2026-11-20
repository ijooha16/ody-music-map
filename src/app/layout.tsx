import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { devModeScript } from "@/constants/dev-mode";
import { TEST_TOOLS } from "@/constants/test-tools";
import AppShell from "@/components/layout/app-shell";
import QueryProvider from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODY",
  description: "음악을 좌표로 탐험하는 별지도",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>

        {TEST_TOOLS && <script dangerouslySetInnerHTML={{ __html: devModeScript }} />}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="h-full">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
