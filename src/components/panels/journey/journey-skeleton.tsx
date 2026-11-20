import Skeleton from "@/components/common/skeleton";
import SkeletonRows from "@/components/common/skeleton-rows";

export default function JourneySkeleton() {
  return (
    <div className="flex flex-col gap-3.5">

      <div className="flex flex-col gap-2 rounded-box-sm bg-white/[.025] px-3 py-2.5">
        <Skeleton w="68%" h={12} />
        <Skeleton w="54%" h={12} />
      </div>
      <p className="lbl text-center">경로를 만드는 중</p>
      <div className="-mx-1.5">
        <SkeletonRows count={6} thumb="none" />
      </div>
    </div>
  );
}
