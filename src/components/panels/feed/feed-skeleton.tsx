import Divider from "@/components/common/divider";
import Skeleton from "@/components/common/skeleton";
import SkeletonRows from "@/components/common/skeleton-rows";

export default function FeedSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-212px)] flex-col gap-3.5">

      <div className="flex items-center gap-2.5">
        <Skeleton w={56} h={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton w="52%" h={20} rounded="box" />
          <Skeleton w="76%" h={10} />
        </div>
      </div>

      <div className="flex gap-3.5">
        <Skeleton w={62} h={13} />
        <Skeleton w={62} h={13} />
        <Skeleton w={50} h={13} />
      </div>
      <Divider />

      <div className="flex flex-col gap-[9px]">
        <div className="flex justify-between gap-3">
          <Skeleton w={96} h={10} />
          <Skeleton w={44} h={10} />
        </div>
        <div className="flex justify-between gap-3">
          <Skeleton w={118} h={10} />
          <Skeleton w={38} h={10} />
        </div>
      </div>
      <Divider />

      <div className="-mx-1.5">
        <SkeletonRows count={5} />
      </div>
    </div>
  );
}
