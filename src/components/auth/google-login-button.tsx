"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID, ROUTES } from "@/constants";
import { useGoogleLoginMutation } from "@/hooks/mutations/use-google-login-mutation";
import GoogleGlyph from "./google-glyph";

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const CLIENT_ID = GOOGLE_CLIENT_ID;

const MATCH_HEIGHT = 47.25;

export default function GoogleLoginButton() {
  const router = useRouter();
  const { mutate, isError, error } = useGoogleLoginMutation();

  const slot = useRef<HTMLDivElement>(null);

  const room = useRef<HTMLDivElement>(null);

  const lastWidth = useRef(0);

  const renderGoogleButton = useCallback(() => {
    if (!slot.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) =>
        mutate(credential, {
          onSuccess: ({ user }) => router.replace(user.nickname ? ROUTES.home : ROUTES.nickname),
        }),
    });

    const box = room.current ?? slot.current;
    const available = box.clientWidth || box.getBoundingClientRect().width;
    const width = Math.round(Math.min(400, Math.max(200, available)));
    lastWidth.current = width;

    window.google.accounts.id.renderButton(slot.current, {
      type: "standard",

      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "center",
      locale: "ko",
      width,
    });
  }, [mutate, router]);

  useEffect(() => {
    const el = room.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const available = Math.round(Math.min(400, Math.max(200, el.clientWidth)));
      if (available !== lastWidth.current) renderGoogleButton();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderGoogleButton]);

  if (!CLIENT_ID) {
    return (
      <p className="rounded-pill border border-line px-3 py-3 text-center text-[14.5px] leading-[1.62] text-ink-2">
        구글 로그인이 설정되지 않았습니다 — <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> 가 필요합니다.
      </p>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderGoogleButton} />

      <div ref={room} className="relative w-full" style={{ height: MATCH_HEIGHT }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-pill bg-white"
        >
          <GoogleGlyph size={18} />
          <span className="text-[15px] font-medium text-[#1f1f1f]">Google 계정으로 계속하기</span>
        </div>

        <div ref={slot} className="absolute inset-0 flex items-center justify-center opacity-0" />
      </div>
      {isError && <p className="mt-2 text-center text-[14.5px] leading-[1.62] text-ink-2">{(error as Error).message}</p>}
    </>
  );
}
