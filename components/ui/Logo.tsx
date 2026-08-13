import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Minimal geometric mark: two interlocking arcs suggesting an open book /
 * crescent, deliberately restrained so it reads as a premium wordmark lock-up
 * rather than a decorative mosque icon.
 */
export function LogoMark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-6 w-6", className)}
      style={style}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M16 4c-4.5 3-6.5 7-6.5 12S11.5 25 16 28c-6.6 0-12-5.4-12-12S9.4 4 16 4Z"
        fill="currentColor"
      />
      <circle cx="22" cy="10" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  wordmark,
  className,
  href = "/",
}: {
  wordmark: string;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-foreground",
        className
      )}
    >
      <LogoMark className="text-accent" />
      <span className="font-display text-lg tracking-tight">{wordmark}</span>
    </Link>
  );
}
