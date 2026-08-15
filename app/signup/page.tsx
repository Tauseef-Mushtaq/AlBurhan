"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard, AuthField } from "@/components/ui/AuthCard";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signUpAction } from "@/lib/auth/actions";

export default function SignupPage() {
  const { t, locale } = useLocale();
  const copy = t.auth.signup;
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  // errorCode is always one of the fixed keys in auth.signup.errors (see
  // lib/auth/actions.ts's safeAuthErrorCode) — never raw Supabase text.
  const errorMessage =
    errorCode && errorCode in copy.errors
      ? copy.errors[errorCode as keyof typeof copy.errors]
      : errorCode
        ? copy.errors.generic
        : null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await signUpAction(formData);
    });
  }

  return (
    <AuthCard
      title={copy.title}
      subtitle={copy.subtitle}
      switchPrompt={copy.switchPrompt}
      switchCta={copy.switchCta}
      switchHref="/login"
    >
      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />

        {errorMessage && (
          <p role="alert" className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <AuthField id="name" label={copy.name} />
        <AuthField id="email" label={copy.email} type="email" />
        <AuthField id="password" label={copy.password} type="password" />
        <AuthField id="confirmPassword" label={copy.confirmPassword} type="password" />
        <LoadingButton
          type="submit"
          className="w-full"
          isLoading={isPending}
          loadingLabel={copy.submitPending}
        >
          {copy.submit}
        </LoadingButton>
      </form>
    </AuthCard>
  );
}
