import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/admin/AdminWidgets";
import { getAdminUsers } from "@/lib/admin/queries";
import { formatDisplayDate } from "@/lib/date";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const locale = getServerLocale();
  const t = getDictionary(locale);
  const u = t.admin.users;

  const search = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const pageSize = 20;

  const { users, totalCount } = await getAdminUsers({ search, page, pageSize });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(nextPage));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-tight text-2xl font-light tracking-tight text-foreground">
        {u.title}
      </h1>

      <form method="get" className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={u.searchPlaceholder}
          className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </form>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs uppercase tracking-[0.1em] text-muted">
                <th className="px-6 py-3 text-start font-medium">{u.name}</th>
                <th className="px-6 py-3 text-start font-medium">{u.email}</th>
                <th className="px-6 py-3 text-start font-medium">{u.role}</th>
                <th className="px-6 py-3 text-start font-medium">{u.timezone}</th>
                <th className="px-6 py-3 text-start font-medium">{u.joined}</th>
                <th className="px-6 py-3 text-start font-medium">{u.lastActivity}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3.5 font-medium text-foreground">{row.name || "—"}</td>
                  <td className="px-6 py-3.5 text-foreground/80">{row.email}</td>
                  <td className="px-6 py-3.5">
                    <RoleBadge role={row.role} adminLabel={t.admin.roles.admin} userLabel={t.admin.roles.user} />
                  </td>
                  <td className="px-6 py-3.5 text-foreground/70">{row.timezone}</td>
                  <td className="px-6 py-3.5 text-foreground/70">
                    {formatDisplayDate(row.createdAt.slice(0, 10), locale)}
                  </td>
                  <td className="px-6 py-3.5 text-foreground/70">
                    {row.lastActivity ? formatDisplayDate(row.lastActivity, locale) : u.never}
                  </td>
                  <td className="px-6 py-3.5 text-end">
                    <Link href={`/admin/users/${row.userId}`} className="text-accent hover:underline">
                      {u.viewDetail}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted">{u.noResults}</p>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none text-muted" : "text-accent hover:underline"}
          >
            {u.previous}
          </Link>
          <span className="text-muted">
            {u.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none text-muted" : "text-accent hover:underline"}
          >
            {u.next}
          </Link>
        </div>
      )}
    </div>
  );
}
