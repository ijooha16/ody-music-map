import type { ReactNode } from "react";
import Avatar from "./avatar";

interface UserRowProps {
  nickname: string | null;
  imageUrl: string | null;
  online?: boolean | null;

  caption?: string | null;

  prefix?: ReactNode;

  right?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export default function UserRow({ nickname, imageUrl, online = null, caption, prefix, right, actions, onClick }: UserRowProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`flex w-full items-center gap-2.5 rounded-box-sm border border-transparent px-[9px] py-2 text-left transition-colors duration-fast ${
        onClick ? "cursor-pointer hover:border-line hover:bg-white/[.055]" : ""
      }`}
    >
      {prefix != null && <span className="num w-5 shrink-0 text-right text-[13.5px] text-ink-4">{prefix}</span>}
      <Avatar src={imageUrl} name={nickname} size={36} online={online} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] leading-[1.3]">{nickname ?? "익명"}</p>
        {caption && <p className="truncate text-[14px] text-ink-3">{caption}</p>}
      </div>
      {right != null && <span className="num shrink-0 text-[13.5px] text-ink-3">{right}</span>}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
