import type { ReactNode, RefObject } from "react";

interface BoxProps {
  title?: ReactNode;

  lead?: ReactNode;

  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;

  flush?: boolean;

  bg?: ReactNode;

  bodyRef?: RefObject<HTMLDivElement | null>;
}

export default function Box({ title, lead, actions, footer, children, className = "", flush = false, bg, bodyRef }: BoxProps) {
  return (
    <section className={`glass-liquid relative flex min-h-0 flex-col overflow-hidden text-ink ${className}`}>
      {bg}
      {(title || lead || actions) && (
        <header

          className={`relative z-20 flex shrink-0 items-center gap-2.5 px-[15px] pt-3.5 pb-3 max-tablet:px-gutter-sm ${bg ? "" : "border-b border-line"}`}
        >

          {lead && <div className="-ml-1 flex shrink-0 items-center max-tablet:-ml-2.5">{lead}</div>}
          <h2 className="flex-1 truncate font-display text-lg font-semibold tracking-[0.01em]">{title}</h2>
          {actions && <div className="flex shrink-0 items-center gap-1 max-tablet:-mr-[9px]">{actions}</div>}
        </header>
      )}

      <div ref={bodyRef} data-sheet-body={flush ? undefined : ""} className={`scroll-quiet relative z-10 min-h-0 flex-1 overflow-y-auto ${flush ? "" : "flex flex-col gap-3.5 px-[15px] pt-3.5 pb-[18px] max-tablet:px-gutter-sm"}`}>{children}</div>
      {footer && <footer className="relative z-10 shrink-0 border-t border-line px-[15px] py-3 max-tablet:px-gutter-sm">{footer}</footer>}
    </section>
  );
}
