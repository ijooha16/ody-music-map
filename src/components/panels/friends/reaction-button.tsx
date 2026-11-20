"use client";

import { useState } from "react";
import { SmileIcon } from "@/components/common/icons";
import { REACTION_REJECTED, type ReactionKey } from "@/constants";
import { useSendReactionMutation } from "@/hooks/mutations/use-send-reaction-mutation";
import { ApiError } from "@/lib/api";
import { reactionRecipients } from "@/lib/realtime/reaction-recipients";
import { useFollowStore } from "@/stores/use-follow-store";
import { useReactionStore } from "@/stores/use-reaction-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { NearbyPerson } from "@/types";
import ReactionPicker from "./reaction-picker";

export default function ReactionButton({ people }: { people: NearbyPerson[] }) {
  const [open, setOpen] = useState(false);
  const push = useReactionStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const send = useSendReactionMutation();
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const riders = useFollowStore((s) => s.riders);

  const handlePick = async (key: ReactionKey) => {
    setOpen(false);
    push({ reactionKey: key, mine: true, fromEmail: null });
    const to = reactionRecipients(people, leaderEmail, riders);
    if (to.length === 0) return;
    const results = await Promise.allSettled(to.map((toEmail) => send.mutateAsync({ toEmail, reactionKey: key })));

    if (results.some((r) => r.status === "fulfilled")) return;
    const first = results[0] as PromiseRejectedResult;
    const code = first.reason instanceof ApiError ? first.reason.code : "UNKNOWN";
    showToast(REACTION_REJECTED[code as keyof typeof REACTION_REJECTED] ?? REACTION_REJECTED.UNKNOWN);
  };

  return (
    <div className="flex flex-row-reverse items-center gap-2">
      <button
        type="button"
        title="반응 보내기"
        aria-label="반응 보내기"
        aria-pressed={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line transition-all duration-fast ${
          open ? "grad-bg border-transparent text-void shadow-glow-azure" : "text-ink-2 hover:border-line-2 hover:text-ink"
        }`}
      >
        <SmileIcon />
      </button>

      {open && <ReactionPicker horizontal onPick={handlePick} />}
    </div>
  );
}
