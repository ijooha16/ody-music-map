import type { ComponentPropsWithRef } from "react";

interface IconButtonProps extends ComponentPropsWithRef<"button"> {
  label: string;
  active?: boolean;

  size?: number;

  glass?: boolean;
}

export default function IconButton({ label, active = false, size = 28, glass = false, className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-pill text-ink-3 transition-colors duration-fast hover:bg-glass-3 hover:text-ink ${
        glass ? "glass rounded-pill! text-ink-2" : ""
      } ${active ? "text-teal" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
