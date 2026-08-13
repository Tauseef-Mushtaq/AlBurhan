"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Activity, BarChart3, FileText, ArrowLeftCircle, Home, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useLocale();

  const links = [
    { href: "/admin", label: t.admin.nav.overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.admin.nav.users, icon: Users },
    { href: "/admin/activity", label: t.admin.nav.activity, icon: Activity },
    { href: "/admin/analytics", label: t.admin.nav.analytics, icon: BarChart3 },
    { href: "/admin/reports", label: t.admin.nav.reports, icon: FileText },
  ];

  // "My Dashboard" and "Home" are grouped separately below a divider —
  // an admin is always also a normal user and must never feel trapped
  // inside /admin (see AdminLayout / requireAdminProfile, which only
  // gates /admin itself, never /app or /).
  const exitLinks = [
    { href: "/app", label: t.admin.nav.backToDashboard, icon: ArrowLeftCircle },
    { href: "/", label: t.admin.nav.home, icon: Home },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-e md:border-border md:bg-foreground md:text-background md:h-screen md:sticky md:top-0 md:py-8">
      <div className="px-6 mb-10 hidden md:block">
        <Logo wordmark={t.hero.eyebrow} href="/admin" className="text-background [&_svg]:text-sand" />
      </div>
      <nav aria-label="Admin" className="flex-1 px-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors shrink-0",
                active
                  ? "bg-background/10 text-background font-medium"
                  : "text-background/60 hover:bg-background/5 hover:text-background/90"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}

        <div className="md:mt-6 md:border-t md:border-background/10 md:pt-4 flex md:flex-col gap-1 shrink-0">
          {exitLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors shrink-0 text-background/60 hover:bg-background/5 hover:text-background/90"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors text-background/60 hover:bg-background/5 hover:text-background/90"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t.admin.nav.logout}
            </button>
          </form>
        </div>
      </nav>
      <div className="px-6 pt-6 hidden md:block">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}

/**
 * Mobile-only header shown above admin content. AdminSidebar is fully
 * hidden below the md breakpoint (it was previously rendered edge-to-edge
 * as a horizontal scroll row on mobile, but its link colors — light
 * text-background/60 — were only ever paired with a dark md:bg-foreground
 * background, so on mobile it rendered as near-invisible pale text on the
 * plain white page background: effectively no visible navigation at all).
 */
export function AdminTopBar() {
  const { t } = useLocale();
  return (
    <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-background sticky top-0 z-40">
      <Logo wordmark={t.hero.eyebrow} href="/admin" />
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          aria-label={t.admin.nav.backToDashboard}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
        >
          <ArrowLeftCircle className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/"
          aria-label={t.admin.nav.home}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
        </Link>
        <LanguageSwitcher />
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label={t.admin.nav.logout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-ivory/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

/** Mobile-only bottom tab bar for the 5 admin sections, matching the same
 * fixed/backdrop-blur pattern as DashboardMobileBar so both user and
 * admin areas feel like one consistent app on mobile. */
export function AdminMobileBar() {
  const pathname = usePathname();
  const { t } = useLocale();

  const links = [
    { href: "/admin", label: t.admin.nav.overview, icon: LayoutDashboard },
    { href: "/admin/users", label: t.admin.nav.users, icon: Users },
    { href: "/admin/activity", label: t.admin.nav.activity, icon: Activity },
    { href: "/admin/analytics", label: t.admin.nav.analytics, icon: BarChart3 },
    { href: "/admin/reports", label: t.admin.nav.reports, icon: FileText },
  ];

  return (
    <nav
      aria-label="Admin"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
    >
      <ul className="grid grid-cols-5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-[44px] text-[10px]",
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
