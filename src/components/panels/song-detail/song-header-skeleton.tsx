import Skeleton from "@/components/common/skeleton";

interface SongHeaderSkeletonProps {
  title?: string | null;
  artist?: string | null;
}

export default function SongHeaderSkeleton({ title, artist }: SongHeaderSkeletonProps) {
  return (
    <>
      <div className="flex items-center gap-2.5">

        <div className="mr-1 flex min-w-0 flex-1 flex-col gap-0.5">
          {title ? (
            <>
              <p className="truncate font-display text-3xl leading-[1.2] font-semibold text-ink drop-shadow-[0_2px_8px_rgba(4,6,13,.85)]">{title}</p>
              <p className="truncate text-sm text-ink-2 drop-shadow-[0_1px_6px_rgba(4,6,13,.9)]">{artist ?? "Unknown"}</p>
            </>
          ) : (
            <>
              <Skeleton w="62%" h={30} rounded="box" />
              <Skeleton w="38%" h={21} />
            </>
          )}
        </div>
        <Skeleton w={36} h={36} />
      </div>

      <div className="flex gap-[5px]">
        <Skeleton w={54} h={19} />
        <Skeleton w={42} h={19} />
        <Skeleton w={66} h={19} />
      </div>
    </>
  );
}
