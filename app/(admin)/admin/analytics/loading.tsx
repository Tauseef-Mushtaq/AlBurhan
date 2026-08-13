import { SkeletonChart, Skeleton } from "@/components/ui/Skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}
