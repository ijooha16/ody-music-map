"use client";

import { useEffect, useRef } from "react";

const SPEED = 38;

const GAP = 48;

export default function MarqueeText({ text, className = "" }: { text: string; className?: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const lead = box?.firstElementChild?.firstElementChild as HTMLElement | undefined;
    if (!box || !lead) return;

    const measure = () => {
      box.dataset.run = "off";
      const overflow = lead.scrollWidth - box.clientWidth;
      if (overflow <= 1) return;
      const shift = lead.scrollWidth + GAP;
      box.style.setProperty("--marquee-shift", `${shift}px`);
      box.style.setProperty("--marquee-dur", `${shift / SPEED}s`);
      box.dataset.run = "on";
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={boxRef} data-run="off" className={`marquee block ${className}`}>
      <span className="marquee-track">
        <span>{text}</span>
        <span className="marquee-copy" style={{ marginLeft: GAP }} aria-hidden>
          {text}
        </span>
      </span>
    </span>
  );
}
