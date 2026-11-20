import Skeleton from "@/components/common/skeleton";

interface SongSectionSkeletonProps {
  cards?: boolean;
}

export default function SongSectionSkeleton({ cards = false }: SongSectionSkeletonProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton w={120} h={13} />
      <Skeleton w="92%" h={10} />
      <Skeleton w="64%" h={10} />
      {cards && (
        <div className="mt-1 flex gap-2">
          <Skeleton w={112} h={112} rounded="box" />
          <Skeleton w={112} h={112} rounded="box" />
          <Skeleton w={112} h={112} rounded="box" />
        </div>
      )}
    </div>
  );
}
