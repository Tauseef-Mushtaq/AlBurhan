# Al Burhan — Module 1: Project Foundation + UI/UX System

A modern Islamic daily-practice and personal-progress platform. This module
establishes the visual system, multilingual (EN/UR/AR) architecture,
routing, and reusable UI for every future module to build on.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Lenis

## Getting started
```bash
npm install
npm run dev
```

## What's implemented (Module 1 scope)
- English / Urdu / Arabic i18n with a centralized, typed dictionary (`lib/i18n`, `locales/`)
- Full LTR/RTL layout support using logical CSS properties — not just `text-align`
- Locale persistence via cookie (read server-side to avoid a flash of wrong direction) + localStorage
- White/minimal/premium design system (`app/globals.css`, `tailwind.config.ts`)
- Script-aware typography: Fraunces + Inter (English), Noto Nastaliq Urdu, Noto Naskh Arabic
- Cinematic scroll-driven homepage (`/`) — Hero → The Day → Salah → Quran → Dhikr → Character → Progress → Final CTA
- Public navigation, dashboard shell (`/app`), admin shell (`/admin`)
- Login / signup UI shells (no auth logic yet)
- Accessibility: skip link, focus states, `prefers-reduced-motion` support, 44px touch targets
- All practice/progress/admin data is **demo/static only** — no backend, no Supabase yet

## Not implemented yet (future modules)
Supabase auth & database, real activity tracking, real progress/analytics,
admin data, 3D/WebGL effects.

## Known limitations
- Google Fonts (`next/font/google`) require network access at build time.
  This sandbox environment blocked `fonts.googleapis.com`, so the production
  build was verified with a temporary font stub — swap back in
  (already done in this delivered code) and it builds normally with internet
  access. `npx tsc --noEmit` passes as-is.
