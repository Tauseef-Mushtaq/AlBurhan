"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function PublicNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#the-day", label: t.nav.journey },
    { href: "#salah", label: t.nav.practice },
    { href: "#progress", label: t.nav.progress },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-cinematic",
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent"
      )}
    >
      <nav className="container-page flex h-20 items-center justify-between" aria-label="Primary">
        <Logo wordmark={t.hero.eyebrow} />

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link
                href="/app"
                className="text-sm text-foreground/80 hover:text-foreground transition-colors px-2"
              >
                {t.nav.dashboard}
              </Link>
              <form action={signOutAction}>
                <Button size="sm" type="submit">
                  {t.nav.logout}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-foreground/80 hover:text-foreground transition-colors px-2"
              >
                {t.nav.login}
              </Link>
              <Link href="/signup">
                <Button size="sm">{t.nav.getStarted}</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center h-11 w-11 -me-2"
          aria-label={t.nav.menu}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <ul className="container-page flex flex-col py-4">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-base text-foreground/80"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="container-page flex flex-col gap-3 pb-6">
            <div className="flex items-center justify-between">
              <Link
                href={isAuthenticated ? "/app" : "/login"}
                className="text-sm text-foreground/80"
                onClick={() => setMobileOpen(false)}
              >
                {isAuthenticated ? t.nav.dashboard : t.nav.login}
              </Link>
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <form action={signOutAction}>
                <Button size="md" type="submit" className="w-full">
                  {t.nav.logout}
                </Button>
              </form>
            ) : (
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button size="md" className="w-full">
                  {t.nav.getStarted}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
