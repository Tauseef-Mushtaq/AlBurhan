"use client";

import { useSearchParams } from "next/navigation";
import { AuthCard, AuthField } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signUpAction } from "@/lib/auth/actions";

export default function SignupPage() {
  const { t, locale } = useLocale();
  const copy = t.auth.signup;
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <AuthCard
      title={copy.title}
      subtitle={copy.subtitle}
      switchPrompt={copy.switchPrompt}
      switchCta={copy.switchCta}
      switchHref="/login"
    >
      <form action={signUpAction} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />

        {error && (
          <p className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <AuthField id="name" label={copy.name} />
        <AuthField id="email" label={copy.email} type="email" />
        <AuthField id="password" label={copy.password} type="password" />
        <AuthField id="confirmPassword" label={copy.confirmPassword} type="password" />
        <Button type="submit" className="w-full">
          {copy.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
