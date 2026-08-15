'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isLocale, defaultLocale } from '@/lib/i18n/config';

function fail(page: 'login' | 'signup', code: string): never {
  redirect(`/${page}?error=${encodeURIComponent(code)}`);
}

/**
 * Supabase's auth error messages are an internal implementation detail —
 * they can change wording between versions and occasionally include
 * information (like confirming an email exists) that shouldn't be shown
 * verbatim. This maps the handful of cases users actually hit to a fixed,
 * safe error CODE (never the raw message), which the login/signup pages
 * then look up in the locale dictionary. Anything unrecognized falls back
 * to a single generic code rather than ever forwarding error.message.
 */
function safeAuthErrorCode(page: 'login' | 'signup', message: string): string {
  const m = message.toLowerCase();
  if (page === 'login') {
    if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
      return 'invalid_credentials';
    }
    if (m.includes('email not confirmed')) {
      return 'email_not_confirmed';
    }
    return 'generic';
  }
  // signup
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'email_taken';
  }
  if (m.includes('password')) {
    return 'weak_password';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'invalid_email';
  }
  return 'generic';
}

export async function signUpAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const locale = formData.get('locale');
  const preferredLocale = isLocale(String(locale))
    ? String(locale)
    : defaultLocale;

  if (!name || !email || !password) {
    fail('signup', 'missing_fields');
  }
  if (password !== confirmPassword) {
    fail('signup', 'password_mismatch');
  }
  if (password.length < 8) {
    fail('signup', 'weak_password');
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
    },
  });

  if (error) {
    fail('signup', safeAuthErrorCode('signup', error.message));
  }

  // Profile creation now happens via the on_auth_user_created trigger
  // (see supabase/migrations/0005_handle_new_user.sql), which runs with
  // elevated privileges directly on the auth.users insert — so it works
  // regardless of whether a session exists yet (e.g. email confirmation
  // pending). If a session exists immediately (confirmation disabled),
  // apply the locale they picked on the signup form; otherwise it stays
  // at the profile's default until they change it in Settings.
  if (data.session) {
    await supabase
      .from('profiles')
      .update({ language: preferredLocale })
      .eq('user_id', data.user!.id);
  }

  if (data.session) {
    redirect('/app');
  }

  // No session yet — Supabase is waiting for email confirmation.
  redirect('/login?notice=check_email');
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/app');

  if (!email || !password) {
    fail('login', 'missing_fields');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    fail('login', safeAuthErrorCode('login', error.message));
  }

  redirect(next.startsWith('/') ? next : '/app');
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
