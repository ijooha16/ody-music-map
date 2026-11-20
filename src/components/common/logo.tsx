"use client";

import { useId } from "react";

interface LogoProps {
  size: number;

  radius?: number;

  twinkle?: boolean;
  className?: string;
}

const STARS = [
  { x: 11, y: 12, r: 1.6, dur: 2.6, begin: -0.4 },
  { x: 50, y: 9, r: 1.2, dur: 3.1, begin: -1.6 },
  { x: 55, y: 26, r: 1.0, dur: 2.2, begin: -0.9 },
  { x: 8, y: 34, r: 1.1, dur: 2.9, begin: -2.1 },
  { x: 16, y: 54, r: 1.4, dur: 2.4, begin: -1.2 },
  { x: 46, y: 56, r: 1.0, dur: 3.4, begin: -0.2 },
  { x: 31, y: 7, r: 0.9, dur: 2.0, begin: -1.9 },
] as const;

export default function Logo({ size, radius = 16, twinkle = true, className = "" }: LogoProps) {
  const uid = useId();
  const bg = `${uid}-bg`;
  const body = `${uid}-body`;
  const clip = `${uid}-clip`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className}`}
      style={{ borderRadius: `${(radius / 64) * 100}%` }}
    >
      <defs>
        <radialGradient id={bg} cx="42%" cy="36%" r="75%">
          <stop offset="0" stopColor="#0c1838" />
          <stop offset="1" stopColor="var(--color-void)" />
        </radialGradient>
        <path id={body} d="M 0 -50 C 26 -50 42 -20 42 6 C 42 32 30 54 18 60 L -18 60 C -30 54 -42 32 -42 6 C -42 -20 -26 -50 0 -50 Z" />
        <clipPath id={clip}>
          <use href={`#${body}`} />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx={radius} fill={`url(#${bg})`} />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e9f1ff" opacity={0.85}>
          {twinkle && <animate attributeName="opacity" values="0.15;0.95;0.15" dur={`${s.dur}s`} begin={`${s.begin}s`} repeatCount="indefinite" />}
        </circle>
      ))}
      <g transform="translate(32 32) rotate(40) scale(0.34) translate(0 -10)">

        <path d="M -30 22 C -50 34 -58 50 -56 62 C -50 64 -36 60 -26 56 Z" fill="#4fe3ce" />
        <path d="M 30 22 C 50 34 58 50 56 62 C 50 64 36 60 26 56 Z" fill="#4fe3ce" />

        <use href={`#${body}`} fill="#e9f1ff" />
        <rect x="0" y="-56" width="60" height="130" fill="#cfd9f7" clipPath={`url(#${clip})`} />

        <path d="M -18 60 L 18 60 C 18 66 10 70 0 70 C -10 70 -18 66 -18 60 Z" fill="#a67cff" />

        <circle cx="0" cy="0" r="33.6" fill="#3a4761" />
        <circle cx="0" cy="0" r="28.8" fill="#a67cff" />
        <circle cx="-9" cy="-9" r="6.4" fill="#ffffff" fillOpacity="0.35" />
      </g>
    </svg>
  );
}
