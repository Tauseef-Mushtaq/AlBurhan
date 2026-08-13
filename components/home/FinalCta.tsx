"use client";

import Link from "next/link";
import { Reveal } from "@/components/home/Reveal";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function FinalCta() {
  const { t } = useLocale();
  return (
    <section className="bg-foreground py-28 sm:py-36 text-background">
      <div className="container-page text-center">
        <Reveal as="h2" className="font-display text-tight text-3xl sm:text-4xl font-light tracking-tight text-balance">
          {t.finalCta.title}
        </Reveal>
        <Reveal as="p" delay={0.08} className="mt-4 text-background/70 text-balance">
          {t.finalCta.subtitle}
        </Reveal>
        <Reveal as="div" delay={0.16} className="mt-10 flex justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
              {t.finalCta.cta}
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
