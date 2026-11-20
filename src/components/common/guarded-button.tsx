"use client";

import type { ComponentProps } from "react";
import { useToastStore } from "@/stores/use-toast-store";
import Button from "./button";

type GuardedButtonProps = ComponentProps<typeof Button> & {
  blocked?: string | null;
};

export default function GuardedButton({ blocked, className = "", ...props }: GuardedButtonProps) {
  const toast = useToastStore((s) => s.show);
  if (!blocked) return <Button className={className} {...props} />;
  return (
    <span role="presentation" className="inline-flex cursor-not-allowed" onClick={() => toast(blocked)}>
      <Button {...props} disabled className={`pointer-events-none ${className}`} />
    </span>
  );
}
