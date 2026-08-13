import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Supabase client for use inside Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth cookies via next/headers.
 *
 * Server Components cannot write cookies, so the `set`/`remove` calls are
 * wrapped in try/catch — middleware (see lib/supabase/middleware.ts) is
 * responsible for refreshing the session cookie on every request.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — middleware refreshes the
            // session instead. Safe to ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}

/**
 * The signed-in user, memoized per request via React `cache()`.
 *
 * Before this, `supabase.auth.getUser()` was called independently by
 * every query/action that needed the caller's identity (profile lookup,
 * timezone lookup, log lookup, report permission checks, admin guard,
 * server actions, …). On a single Today-page render that meant 4-6
 * redundant round trips to Supabase Auth for the exact same answer.
 *
 * `cache()` scopes the memoization to a single server render/request —
 * it is never shared across users or across requests, so this changes
 * nothing about auth or RLS, only how many times the same question gets
 * asked. Each call still creates its own Supabase client (cheap, and
 * required since cookies() must be read per-request), only the network
 * round trip to resolve `user` is deduplicated.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
