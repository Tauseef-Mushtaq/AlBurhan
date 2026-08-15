"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard, AuthField } from "@/components/ui/AuthCard";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { signInAction } from "@/lib/auth/actions";

export default function LoginPage() {
  const { t } = useLocale();
  const copy = t.auth.login;
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const notice = searchParams.get("notice");
  const next = searchParams.get("next") ?? "/app";
  const [isPending, startTransition] = useTransition();

  // errorCode is always one of the fixed keys in auth.login.errors (see
  // lib/auth/actions.ts's safeAuthErrorCode) — never raw Supabase text.
  // An unrecognized/tampered code still falls back to the safe generic
  // message rather than rendering nothing or the raw code itself.
  const errorMessage =
    errorCode && errorCode in copy.errors
      ? copy.errors[errorCode as keyof typeof copy.errors]
      : errorCode
        ? copy.errors.generic
        : null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await signInAction(formData);
    });
  }

  return (
    <AuthCard
      title={copy.title}
      subtitle={copy.subtitle}
      switchPrompt={copy.switchPrompt}
      switchCta={copy.switchCta}
      switchHref="/signup"
    >
      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="next" value={next} />

        {notice === "check_email" && (
          <p role="status" className="rounded-md bg-ivory px-3.5 py-2.5 text-sm text-foreground/80">
            {copy.checkEmailNotice}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <AuthField id="email" label={copy.email} type="email" />
        <AuthField id="password" label={copy.password} type="password" />
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
