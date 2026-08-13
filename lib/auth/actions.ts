'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isLocale, defaultLocale } from '@/lib/i18n/config';

function fail(page: 'login' | 'signup', message: string): never {
  redirect(`/${page}?error=${encodeURIComponent(message)}`);
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
    fail('signup', 'Please fill in every field.');
  }
  if (password !== confirmPassword) {
    fail('signup', 'Passwords do not match.');
  }
  if (password.length < 8) {
    fail('signup', 'Password must be at least 8 characters.');
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
    fail('signup', error.message);
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
    fail('login', 'Please enter your email and password.');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    fail('login', error.message);
  }

  redirect(next.startsWith('/') ? next : '/app');
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
