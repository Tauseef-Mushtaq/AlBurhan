import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function AdminActivityLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-40" />
      <div className="rounded-lg border border-border bg-background p-6 divide-y divide-border">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
