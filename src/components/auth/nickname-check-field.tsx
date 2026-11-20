"use client";

import { NICKNAME_MAX, nicknameError } from "@/lib/auth-rules";
import { useNicknameAvailableQuery } from "@/hooks/queries/use-nickname-available-query";
import { useEffect, useState } from "react";
import AuthField from "./auth-field";

export default function NicknameCheckField({
  value,
  onChange,
  onStatus,
  current,
}: {
  value: string;
  onChange: (v: string) => void;

  onStatus: (ok: boolean) => void;

  current?: string | null;
}) {
  const [debounced, setDebounced] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 350);
    return () => clearTimeout(t);
  }, [value]);

  const unchanged = !!current && value.trim() === current.trim();
  const formatError = touched ? nicknameError(value) : null;
  const check = useNicknameAvailableQuery(unchanged ? "" : debounced);
  const settled = !nicknameError(value) && debounced === value.trim() && check.isSuccess;
  const taken = !unchanged && settled && check.data?.available === false;
  const free = unchanged || (settled && check.data?.available === true);

  useEffect(() => onStatus(free), [free, onStatus]);

  return (
    <AuthField
      label="닉네임"
      placeholder="지도에서 보일 이름"
      maxLength={NICKNAME_MAX}
      value={value}
      error={formatError ?? (taken ? "이미 사용 중인 닉네임이에요." : null)}
      hint={unchanged ? "지금 쓰고 있는 닉네임이에요." : free ? "쓸 수 있는 닉네임이에요." : `2~${NICKNAME_MAX}자 · 다른 사람과 겹칠 수 없어요`}
      onChange={(e) => {
        onChange(e.target.value);
        setTouched(true);
      }}
    />
  );
}
