import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export interface AdminProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

/**
 * Same role re-read as requireAdminProfile, but returns null instead of
 * redirecting. Page components (which must redirect) use
 * requireAdminProfile below; API routes and other non-page server code
 * (e.g. lib/reports/permissions.ts) use this directly and decide for
 * themselves how to respond to "not an admin" (typically a 403 JSON
 * response, not a redirect).
 */
export const getAdminProfile = cache(async (): Promise<AdminProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, name, email, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile as AdminProfile;
});

/**
 * Server-side, defense-in-depth admin check. `middleware.ts` already
 * blocks `/admin/**` for non-admins on every request, but every admin
 * Server Component calls this too — the role is re-read from `profiles`
 * here rather than trusted from anywhere upstream, so this page is safe
 * even if it were ever reached by a route that bypasses the middleware.
 */
export async function requireAdminProfile(): Promise<AdminProfile> {
  const profile = await getAdminProfile();

  if (!profile) {
    const user = await getAuthUser();
    redirect(user ? "/app" : "/login");
  }

  return profile;
}
