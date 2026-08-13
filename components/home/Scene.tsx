import type { ReactNode } from "react";
import { Reveal } from "@/components/home/Reveal";
import { SectionLabel } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function Scene({
  id,
  label,
  title,
  body,
  children,
  tone = "light",
}: {
  id: string;
  label: string;
  title: string;
  body: string;
  children?: ReactNode;
  tone?: "light" | "warm";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-28 sm:py-36",
        tone === "warm" ? "bg-warm" : "bg-background"
      )}
    >
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="div">
            <SectionLabel>{label}</SectionLabel>
          </Reveal>
          <Reveal as="h2" delay={0.05} className="mt-4 font-display text-tight text-3xl sm:text-4xl font-light tracking-tight text-balance">
            {title}
          </Reveal>
          <Reveal as="p" delay={0.1} className="mt-5 text-muted text-balance leading-relaxed">
            {body}
          </Reveal>
        </div>
        {children && (
          <Reveal as="div" delay={0.18} className="mt-14">
            {children}
          </Reveal>
        )}
      </div>
    </section>
  );
}
