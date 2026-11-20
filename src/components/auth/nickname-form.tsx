"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ROUTES } from "@/constants";
import { nicknameError } from "@/lib/auth-rules";
import { useUpdateNicknameMutation } from "@/hooks/mutations/use-update-nickname-mutation";
import type { ApiError } from "@/lib/api";
import NicknameCheckField from "./nickname-check-field";

export default function NicknameForm() {
  const router = useRouter();
  const save = useUpdateNicknameMutation();
  const [value, setValue] = useState("");
  const [ok, setOk] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameError(value)) return;
    save.mutate(value, { onSuccess: () => router.replace(ROUTES.home) });
  };

  return (
    <form onSubmit={submit} noValidate>
      <NicknameCheckField value={value} onChange={setValue} onStatus={useCallback((v: boolean) => setOk(v), [])} />

      {save.isError && <p className="mt-3 text-[13.5px] text-bad">{(save.error as ApiError).message}</p>}

      <button
        type="submit"
        disabled={save.isPending || !ok}
        className="grad-bg mt-5 w-full rounded-pill py-3 text-[15.5px] font-semibold text-[#031018] shadow-[0_8px_28px_-12px_rgba(92,157,255,.9)] transition-[filter] hover:brightness-110 disabled:opacity-60"
      >
        {save.isPending ? "저장 중…" : "이 닉네임으로 시작하기"}
      </button>
    </form>
  );
}
