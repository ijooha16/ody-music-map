import { useMemo } from "react";
import { GENRE_COLORS } from "@/constants/design-tokens";
import { hash01 } from "./render/star-look";

const AREA_PER_STAR = 12000;
const MIN_STARS = 60;

const MAX_STARS = 200;

function makeStars(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const rgb = GENRE_COLORS[Math.floor(hash01(i * 31 + 7) * GENRE_COLORS.length)];
    const mag = hash01(i * 17 + 3);
    const size = 2 + mag * 4;
    return {
      left: 4 + hash01(i * 7 + 1) * 92,
      top: 4 + hash01(i * 13 + 5) * 92,
      size,
      opacity: 0.35 + mag * 0.55,
      delay: hash01(i * 23 + 11) * 2.4,
      color: `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`,
      glow: size * 3.5,
    };
  });
}

interface StarfieldPlaceholderProps {
  width: number;
  height: number;

  failed?: boolean;
}

export default function StarfieldPlaceholder({ width, height, failed = false }: StarfieldPlaceholderProps) {
  const count = Math.min(MAX_STARS, Math.max(MIN_STARS, Math.round((width * height) / AREA_PER_STAR)));
  const stars = useMemo(() => makeStars(count), [count]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="animate-pulse-dot absolute rounded-pill"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            background: s.color,
            boxShadow: `0 0 ${s.glow}px ${s.color}`,

            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {!failed && <p className="lbl absolute inset-0 flex items-center justify-center">별을 불러오는 중</p>}
    </div>
  );
}
