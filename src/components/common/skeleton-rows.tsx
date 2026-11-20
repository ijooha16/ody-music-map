import Skeleton from "./skeleton";

const TITLE_W = ["72%", "54%", "81%", "63%", "45%"];
const SUB_W = ["38%", "47%", "29%", "41%", "34%"];

interface SkeletonRowsProps {
  count?: number;

  thumb?: "square" | "circle" | "none";

  right?: boolean;

  sub?: boolean;
}

export default function SkeletonRows({ count = 5, thumb = "square", right = true, sub = true }: SkeletonRowsProps) {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-[9px] py-2">
          {thumb !== "none" && <Skeleton w={36} h={36} rounded={thumb === "circle" ? "pill" : "box"} />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton w={TITLE_W[i % TITLE_W.length]} h={11} />
            {sub && <Skeleton w={SUB_W[i % SUB_W.length]} h={9} />}
          </div>
          {right && <Skeleton w={28} h={9} />}
        </div>
      ))}
    </div>
  );
}
