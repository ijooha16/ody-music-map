import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const SearchIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

export const MouseWheelIcon = ({ size = 40, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.5}>
    <rect x="7" y="2" width="10" height="20" rx="5" />
    <path d="M12 6.5v3" />
  </svg>
);

export const MoreIcon = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.6}>
    <path d="M5 12h.01" />
    <path d="M12 12h.01" />
    <path d="M19 12h.01" />
  </svg>
);

export const LocateIcon = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="6.2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <path d="M12 1.8v3.2M12 19v3.2M1.8 12h3.2M19 12h3.2" />
  </svg>
);
export const CloseIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const BackIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.2}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const FriendsIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.2 19c.5-3.3 3-5.2 5.8-5.2s5.3 1.9 5.8 5.2" />
    <circle cx="17.5" cy="9.5" r="2.4" />
    <path d="M16 14.4c2.5.1 4.3 1.9 4.8 4.6" />
  </svg>
);
export const JourneyIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="5.5" cy="18.5" r="2.4" />
    <circle cx="18.5" cy="5.5" r="2.4" />
    <path d="M7.6 16.8C11 14 9 10.5 12.4 7.6" />
  </svg>
);

export const MapIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4.5 16.5 9 8l4.5 4.5L20 3" />
    <circle cx="4.5" cy="16.5" r="1.6" />
    <circle cx="9" cy="8" r="1.6" />
    <circle cx="13.5" cy="12.5" r="1.6" />
    <circle cx="20" cy="3" r="1.6" />
  </svg>
);
export const RankIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 20V12M12 20V5M19 20v-6" />
  </svg>
);
export const UserIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6" />
  </svg>
);
export const PlayIcon = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const PauseIcon = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </svg>
);

export const ListPlayIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2}>
    <path d="M4 7h12M4 12h9M4 17h6" />
    <path d="M15.6 13.4v7.2l6-3.6z" fill="currentColor" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);
export const PrevIcon = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M7 5h2v14H7zM20 5v14l-10-7z" />
  </svg>
);
export const NextIcon = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M15 5h2v14h-2zM4 5l10 7-10 7z" />
  </svg>
);

export const CoronaIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    <path d="M12 6.4V4M12 20v-2.4M6.4 12H4M20 12h-2.4M8.1 8.1 6.4 6.4M15.9 15.9l1.7 1.7M15.9 8.1l1.7-1.7M8.1 15.9l-1.7 1.7" />
    <circle cx="12" cy="2.9" r="1.05" />
    <circle cx="12" cy="21.1" r="1.05" />
    <circle cx="2.9" cy="12" r="1.05" />
    <circle cx="21.1" cy="12" r="1.05" />
  </svg>
);
export const SmileIcon = ({ size = 19, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2" />
    <circle cx="9" cy="9.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const InfoIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.6" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const HelpIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.9.6-1.3 1.1-1.3 2.1" />
    <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
  </svg>
);

export const FlagIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2.2 3.6L16 11H5" />
  </svg>
);

export const ChevronRightIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.1}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
);

export const ChevronDownIcon = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2.1}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const ClockIcon = ({ size = 13, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.4V12l3.2 2" />
  </svg>
);

export const RefreshIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M19.6 12a7.6 7.6 0 1 1-2.2-5.4" />
    <path d="M19.8 4.4v4.2h-4.2" />
  </svg>
);

export const CalendarIcon = ({ size = 13, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
    <path d="M3.6 10.2h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
  </svg>
);

export const PlaylistAddIcon = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 7h12M4 12h12M4 17h6.5" />
    <path d="M17 14.2v6M14 17.2h6" />
  </svg>
);

export const DepartIcon = ({ size = 15, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="6.4" cy="17.6" r="3.1" />
    <path d="M9.9 14.1 18 6" />
    <path d="M12.6 6H18v5.4" />
  </svg>
);

export const ArriveIcon = ({ size = 15, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="17.6" cy="17.6" r="3.1" />
    <path d="M6 6l7.4 7.4" />
    <path d="M8.8 13.4h4.6V8.8" />
  </svg>
);

export const SirenIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M7.6 18.6v-3.4a4.4 4.4 0 0 1 8.8 0v3.4" />
    <path d="M5.2 18.6h13.6" />
    <path d="M12 8.6V6.4" />
    <path d="M6.3 11.5 4.2 10.3M17.7 11.5l2.1-1.2" />
  </svg>
);

export const GripIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.7}>
    <path d="M4 8h16" />
    <path d="M4 12h16" />
    <path d="M4 16h16" />
  </svg>
);

export const CatConstellationIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <path d="M4.5 5.5 8 9.5h8l3.5-4-1 8.5-3.5 5h-6l-3.5-5z" />
    {[
      [4.5, 5.5],
      [8, 9.5],
      [16, 9.5],
      [19.5, 5.5],
      [18.5, 14],
      [15, 19],
      [9, 19],
      [5.5, 14],
    ].map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.45" fill="currentColor" stroke="none" />
    ))}
    <circle cx="9.8" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const HeartIcon = ({ size = 17, filled = false, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.3S4.5 15.6 4.5 10.2A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.4-7.5 10.1-7.5 10.1z" />
  </svg>
);
