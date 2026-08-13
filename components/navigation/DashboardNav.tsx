"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LineChart, History, Settings, LogOut, ShieldCheck, Home } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

function useDashboardLinks() {
  const { t } = useLocale();
  return [
    { href: "/app", label: t.dashboard.nav.today, icon: CalendarCheck },
    { href: "/app/progress", label: t.dashboard.nav.progress, icon: LineChart },
    { href: "/app/history", label: t.dashboard.nav.history, icon: History },
    { href: "/app/settings", label: t.dashboard.nav.settings, icon: Settings },
  ];
}

interface NavProps {
  /** Whether the signed-in user is an admin. Purely a display decision —
   * this is what makes the "Admin Panel" link appear at all, but it is
   * never the security boundary: /admin itself is still guarded server-side
   * by middleware.ts and lib/admin/guard.ts regardless of what renders here. */
  isAdmin?: boolean;
}

export function DashboardSidebar({ isAdmin = false }: NavProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const links = useDashboardLinks();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-e md:border-border md:bg-warm md:h-screen md:sticky md:top-0 md:py-8">
      <div className="px-6 mb-10">
        <Logo wordmark={t.hero.eyebrow} href="/app" />
      </div>
      <nav aria-label="Dashboard" className="flex-1 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-background text-accent font-medium shadow-sm"
                  : "text-foreground/70 hover:bg-background/70 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-border" aria-hidden="true" />
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-background/70 hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t.dashboard.nav.adminPanel}
            </Link>
          </>
        )}
      </nav>
      <div className="px-6 pt-6 space-y-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3.5 py-2.5 -mx-3.5 text-sm text-foreground/70 transition-colors hover:bg-background/70 hover:text-foreground"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.nav.home}
        </Link>
        <LanguageSwitcher />
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-background/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t.dashboard.nav.logout}
          </button>
        </form>
      </div>
    </aside>
  );
}

export function DashboardTopBar({ isAdmin = false }: NavProps) {
  const { t } = useLocale();
  return (
    <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-background sticky top-0 z-40">
      <Logo wordmark={t.hero.eyebrow} href="/app" />
      <div className="flex items-center gap-2">
        <Link
          href="/"
          aria-label={t.dashboard.nav.home}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            aria-label={t.dashboard.nav.adminPanel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
        <LanguageSwitcher />
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label={t.dashboard.nav.logout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function DashboardMobileBar() {
  const pathname = usePathname();
  const links = useDashboardLinks();
  return (
    <nav
      aria-label="Dashboard"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
    >
      <ul className="grid grid-cols-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[44px] text-[11px]",
                  active ? "text-accent" : "text-foreground/60"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
