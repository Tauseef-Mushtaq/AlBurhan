import { Fraunces, Inter } from "next/font/google";

/**
 * Urdu (Noto Nastaliq Urdu) and Arabic (Noto Naskh Arabic) are
 * self-hosted via @fontsource rather than fetched from Google Fonts at
 * build/runtime (see app/layout.tsx, which imports the specific weight
 * files). This fixes two things at once:
 *
 * 1. The exported PDF/image reports render with a fallback system font
 *    instead of proper Nastaliq/Naskh shaping whenever the Google Fonts
 *    request hadn't finished (or wasn't reachable) by the time
 *    html2canvas rasterized the off-screen report node — a real race
 *    that next/font/google's runtime fetch doesn't fully eliminate.
 * 2. The app no longer depends on fonts.googleapis.com being reachable
 *    at build time at all for Urdu/Arabic — it now works offline and in
 *    network-restricted environments (see instruction #11).
 *
 * The actual font files ship inside the @fontsource packages
 * (node_modules/@fontsource/noto-nastaliq-urdu, .../noto-naskh-arabic),
 * bundled by Next.js like any other static asset — nothing is fetched
 * over the network at request time.
 *
 * English/display typography (Fraunces, Inter) is unchanged and still
 * uses next/font/google, per the "don't change English typography"
 * requirement.
 */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Clean, highly-legible body face for English UI copy. */
export const fontBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

/**
 * `--font-arabic` / `--font-urdu` are defined as plain CSS custom
 * properties in app/globals.css (`:root`), pointing at the literal
 * self-hosted font-family names ('Noto Naskh Arabic' / 'Noto Nastaliq
 * Urdu') registered by the @fontsource imports in app/layout.tsx — there
 * is no next/font object for these two anymore, so nothing here needs to
 * contribute a `.variable` class for them.
 */
export const fontVariables = `${fontDisplay.variable} ${fontBody.variable}`;
