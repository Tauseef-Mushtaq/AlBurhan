"use client";

import { useSearchParams } from "next/navigation";
import { AuthCard, AuthField } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signInAction } from "@/lib/auth/actions";

export default function LoginPage() {
  const { t } = useLocale();
  const copy = t.auth.login;
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const notice = searchParams.get("notice");
  const next = searchParams.get("next") ?? "/app";

  return (
    <AuthCard
      title={copy.title}
      subtitle={copy.subtitle}
      switchPrompt={copy.switchPrompt}
      switchCta={copy.switchCta}
      switchHref="/signup"
    >
      <form action={signInAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />

        {notice === "check_email" && (
          <p className="rounded-md bg-ivory px-3.5 py-2.5 text-sm text-foreground/80">
            Account created — check your email to confirm before signing in.
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <AuthField id="email" label={copy.email} type="email" />
        <AuthField id="password" label={copy.password} type="password" />
        <Button type="submit" className="w-full">
          {copy.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
