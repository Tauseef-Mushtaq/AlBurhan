import { SkeletonCard, SkeletonChart, Skeleton } from "@/components/ui/Skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart />
    </div>
  );
}
