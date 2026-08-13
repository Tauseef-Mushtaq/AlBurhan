"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function Hero({ dayScore }: { dayScore?: number }) {
  const { t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    if (!el) return;

    if (prefersReduced) {
      gsap.set(el.querySelectorAll("[data-hero-item]"), { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-hero-item]"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.14, delay: 0.15 }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-warm px-6 text-center"
    >
      {/* Subtle Islamic geometric backdrop — restrained, not decorative */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="currentColor" strokeWidth="0.6" fill="none">
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx="400" cy="400" r={40 + i * 40} />
          ))}
        </g>
      </svg>

      <div className="relative max-w-3xl mx-auto">
        {typeof dayScore === "number" && (
          <p
            data-hero-item
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs text-foreground/70"
          >
            <span className="font-semibold text-accent">{dayScore}%</span>
            {t.dashboard.todayProgress}
          </p>
        )}
        <p data-hero-item className="mb-6 text-xs font-medium uppercase tracking-[0.28em] text-accent">
          {t.hero.eyebrow}
        </p>
        <h1
          data-hero-item
          className="font-display text-tight text-4xl sm:text-5xl md:text-6xl font-light leading-[1.15] tracking-tight text-foreground text-balance"
        >
          {t.hero.title}
        </h1>
        <p
          data-hero-item
          className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted text-balance"
        >
          {t.hero.subtitle}
        </p>
        <div data-hero-item className="mt-10 flex justify-center">
          <Link href="/signup">
            <Button size="lg">{t.hero.cta}</Button>
          </Link>
        </div>
      </div>

      <div
        data-hero-item
        className="absolute bottom-10 flex flex-col items-center gap-2 text-muted"
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">{t.hero.scroll}</span>
        <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
}
