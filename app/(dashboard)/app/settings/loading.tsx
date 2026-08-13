import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-lg" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-4 rounded-lg border border-border bg-background p-6">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}
