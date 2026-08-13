import { cn } from "@/lib/utils";

/**
 * Minimal skeleton primitive shared by every route-level loading.tsx and
 * inline section loading state. Uses the existing --color-border /
 * --color-ivory tokens rather than a generic gray so it matches the rest
 * of the design system. The shimmer is a subtle opacity pulse (not a
 * moving gradient) and is disabled entirely under prefers-reduced-motion
 * via the `motion-reduce:animate-none` utility — no separate JS check
 * needed since Tailwind's variant reads the same media query.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse motion-reduce:animate-none rounded-md bg-ivory",
        className
      )}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full max-w-[220px]", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <Skeleton className={cn("h-9 w-9 rounded-full", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-6 space-y-3",
        className
      )}
    >
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      <SkeletonCircle className="h-8 w-8 shrink-0" />
      <Skeleton className="h-3.5 flex-1" />
      <Skeleton className="h-3.5 w-16 shrink-0" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-6", className)}>
      <Skeleton className="h-3.5 w-32 mb-6" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
