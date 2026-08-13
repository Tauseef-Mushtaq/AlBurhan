import { PublicNav } from "@/components/navigation/PublicNav";
import { SmoothScroll } from "@/components/home/SmoothScroll";
import { Hero } from "@/components/home/Hero";
import { Scene } from "@/components/home/Scene";
import { SalahRow } from "@/components/home/SalahRow";
import { CharacterPillars } from "@/components/home/CharacterPillars";
import { ProgressSteps } from "@/components/home/ProgressSteps";
import { FinalCta } from "@/components/home/FinalCta";
import { Footer } from "@/components/home/Footer";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getPracticesForDate } from "@/lib/practices/queries";
import { calculateDayScore } from "@/lib/progress/calculations";

export default async function HomePage() {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read-only: the homepage only ever reads today's score for a
  // personalized greeting, never mutates practice data.
  let dayScorePercent: number | undefined;
  if (user) {
    const { date, categories } = await getPracticesForDate();
    dayScorePercent = calculateDayScore(date, categories, locale).score;
  }

  return (
    <>
      <SmoothScroll />
      <PublicNav isAuthenticated={!!user} />
      <main id="main-content">
        <Hero dayScore={dayScorePercent} />

        <Scene
          id="the-day"
          label={t.sections.theDay.label}
          title={t.sections.theDay.title}
          body={t.sections.theDay.body}
        />

        <Scene
          id="salah"
          label={t.sections.salah.label}
          title={t.sections.salah.title}
          body={t.sections.salah.body}
          tone="warm"
        >
          <SalahRow />
        </Scene>

        <Scene
          id="quran"
          label={t.sections.quran.label}
          title={t.sections.quran.title}
          body={t.sections.quran.body}
        />

        <Scene
          id="dhikr"
          label={t.sections.dhikr.label}
          title={t.sections.dhikr.title}
          body={t.sections.dhikr.body}
          tone="warm"
        />

        <Scene
          id="character"
          label={t.sections.character.label}
          title={t.sections.character.title}
          body={t.sections.character.body}
        >
          <CharacterPillars />
        </Scene>

        <Scene
          id="progress"
          label={t.sections.progress.label}
          title={t.sections.progress.title}
          body={t.sections.progress.body}
          tone="warm"
        >
          <ProgressSteps />
        </Scene>

        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
