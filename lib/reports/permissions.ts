import { getAuthUser } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/admin/guard";
import { ReportPermissionError } from "@/lib/reports/types";

/**
 * Resolves which user's data a report request may read.
 *
 * - No `requestedUserId` (or it matches the caller) → the caller's own
 *   data. Always allowed for any signed-in user.
 * - A different `requestedUserId` → only allowed if the caller is an
 *   admin, verified here server-side via lib/admin/guard.ts (which
 *   re-reads `profiles.role`, never trusting a client-supplied role).
 *
 * `requestedUserId` must always come from a request the server itself
 * validated (a route handler's query param, a form field) — never from
 * anything implicitly trusted. This function is the single place that
 * makes the trust decision, so every report entry point calls it first.
 */
export async function resolveReportUserId(
  requestedUserId: string | null | undefined
): Promise<{ userId: string; isAdminActingOnOther: boolean }> {
  const user = await getAuthUser();

  if (!user) {
    throw new ReportPermissionError("Not signed in.", 401);
  }

  if (!requestedUserId || requestedUserId === user.id) {
    return { userId: user.id, isAdminActingOnOther: false };
  }

  const adminProfile = await getAdminProfile();
  if (!adminProfile) {
    throw new ReportPermissionError("Not authorized to view this user's report.", 403);
  }

  return { userId: requestedUserId, isAdminActingOnOther: true };
}
