export default function Skeleton({ w = "100%", h = 12, rounded = "pill", className = "" }: { w?: number | string; h?: number; rounded?: "pill" | "box"; className?: string }) {
  return <span aria-hidden style={{ width: w, height: h }} className={`skel block shrink-0 ${rounded === "pill" ? "rounded-pill" : "rounded-box-sm"} ${className}`} />;
}
