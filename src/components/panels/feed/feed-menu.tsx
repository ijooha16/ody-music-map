"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ProfileEditDialog from "@/components/auth/profile-edit-dialog";
import { MoreIcon } from "@/components/common/icons";
import { ROUTES } from "@/constants";
import { useLogoutMutation } from "@/hooks/mutations/use-logout-mutation";

export default function FeedMenu() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logout = useLogoutMutation();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "w-full px-3.5 py-2.5 text-left text-[14.5px] text-ink-2 transition-colors hover:bg-white/[.055] hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="더 보기"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-[26px] w-[26px] place-items-center rounded-pill transition-colors ${
          open ? "bg-white/[.08] text-ink" : "text-ink-3 hover:bg-white/[.055] hover:text-ink"
        }`}
      >
        <MoreIcon />
      </button>
      {open && (
        <div
          role="menu"
          className="glass-liquid animate-rpop absolute top-full right-0 z-30 mt-1.5 w-[132px] overflow-hidden rounded-box-sm py-1 shadow-[0_18px_44px_-16px_#000]"
        >
          <button type="button" role="menuitem" className={item} onClick={() => (setOpen(false), setEditing(true))}>
            내 정보 수정
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            className={`${item} text-bad hover:text-bad disabled:opacity-50`}

            onClick={() => logout.mutate(undefined, { onSettled: () => router.replace(ROUTES.login) })}
          >
            {logout.isPending ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      )}
      {editing && <ProfileEditDialog onClose={() => setEditing(false)} />}
    </div>
  );
}
