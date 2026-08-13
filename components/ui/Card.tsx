import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-6",
        className
      )}
      {...props}
    />
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-xs font-medium uppercase tracking-[0.18em] text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
