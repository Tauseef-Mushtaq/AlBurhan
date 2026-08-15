import { cn } from "@/lib/utils";

/**
 * A small inline spinner. Uses `motion-reduce:animate-none` so it freezes
 * to a static ring under prefers-reduced-motion rather than spinning —
 * the point (communicating "in progress") still comes across via the
 * partial-ring shape and any accompanying text/aria-busy, not motion.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin motion-reduce:animate-none", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
