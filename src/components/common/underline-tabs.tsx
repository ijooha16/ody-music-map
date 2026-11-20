"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface UnderlineTabsProps<T extends string> {
  items: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
}

export default function UnderlineTabs<T extends string>({ items, value, onChange }: UnderlineTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-key="${value}"]`);
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, items]);

  return (
    <div ref={listRef} role="tablist" className="relative flex border-b border-line">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          data-key={item.key}
          aria-selected={value === item.key}
          onClick={() => onChange(item.key)}
          className={`flex-1 px-3 py-2 text-center text-[15px] transition-colors duration-fast ${value === item.key ? "font-medium text-ink" : "text-ink-3 hover:text-ink-2"}`}
        >
          {item.label}
        </button>
      ))}

      <span
        aria-hidden
        className="absolute -bottom-px h-[2px] rounded-pill bg-teal transition-[transform,width] duration-300 ease-out"
        style={{ width: bar.width, transform: `translateX(${bar.left}px)` }}
      />
    </div>
  );
}
