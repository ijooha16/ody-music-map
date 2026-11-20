"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/common/avatar";
import Skeleton from "@/components/common/skeleton";
import { ROUTES } from "@/constants";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { useUpdateNicknameMutation } from "@/hooks/mutations/use-update-nickname-mutation";
import { useUpdateProfileImageMutation } from "@/hooks/mutations/use-update-profile-image-mutation";
import type { ApiError } from "@/lib/api";
import type { User } from "@/types";
import NicknameCheckField from "./nickname-check-field";

export default function ProfileEditForm({ onDone }: { onDone?: () => void }) {
  const { data: me, isPending } = useMeQuery();
  if (isPending) return <EditSkeleton />;
  if (!me) return <p className="text-center text-[14px] text-bad">내 정보를 불러오지 못했어요.</p>;
  return <Fields key={me.email} me={me} onDone={onDone} />;
}

function EditSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton w={64} h={64} />
        <Skeleton w={64} h={11} />
        <Skeleton w={182} h={9} />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton w={48} h={9} />
        <Skeleton w="100%" h={42} rounded="box" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Skeleton w="100%" h={44} />
        </div>
        <div className="flex-[1.4]">
          <Skeleton w="100%" h={44} />
        </div>
      </div>
    </div>
  );
}

function Fields({ me, onDone }: { me: User; onDone?: () => void }) {
  const router = useRouter();

  const done = onDone ?? (() => router.replace(ROUTES.home));
  const saveNickname = useUpdateNicknameMutation();
  const saveImage = useUpdateProfileImageMutation();

  const [nickname, setNickname] = useState(me.nickname ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [nicknameOk, setNicknameOk] = useState(false);
  const pickFile = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const nicknameChanged = nickname.trim() !== (me.nickname ?? "").trim();
  const dirty = nicknameChanged || file !== null;
  const pending = saveNickname.isPending || saveImage.isPending;
  const error = (saveNickname.error ?? saveImage.error) as ApiError | null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dirty) return done();
    if (nicknameChanged && !nicknameOk) return;

    try {
      if (nicknameChanged) await saveNickname.mutateAsync(nickname.trim());
      if (file) await saveImage.mutateAsync(file);
      done();
    } catch {
      // 오류 문구는 아래에서 보여준다
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <Avatar src={preview ?? me.imageUrl} name={nickname || me.name} size={64} />
        <button type="button" onClick={() => pickFile.current?.click()} className="text-[13.5px] text-ink-2 underline underline-offset-2 hover:text-ink-1">
          사진 바꾸기
        </button>
        <input
          ref={pickFile}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-[13px] text-ink-3">{file ? `${file.name} — 저장하면 올라가요` : "5MB 까지, 이미지 파일만 올릴 수 있어요"}</p>
      </div>

      <NicknameCheckField value={nickname} onChange={setNickname} onStatus={useCallback((v: boolean) => setNicknameOk(v), [])} current={me.nickname} />

      {error && <p className="text-[13.5px] text-bad">{error.message}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={done}
          className="flex-1 rounded-pill border border-line py-3 text-[15px] text-ink-2 transition-colors hover:border-line-2"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending || (nicknameChanged && !nicknameOk)}
          className="grad-bg flex-[1.4] rounded-pill py-3 text-[15.5px] font-semibold text-[#031018] shadow-[0_8px_28px_-12px_rgba(92,157,255,.9)] transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "저장 중…" : dirty ? "저장하기" : "그대로 두기"}
        </button>
      </div>
    </form>
  );
}
