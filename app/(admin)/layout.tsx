import { AdminSidebar, AdminTopBar, AdminMobileBar } from "@/components/navigation/AdminNav";
import { requireAdminProfile } from "@/lib/admin/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware.ts already blocks /admin/** for non-admins
  // on every request. This second, server-side check re-reads the role
  // directly from profiles before rendering anything under /admin.
  await requireAdminProfile();

  return (
    <div className="md:flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <AdminTopBar />
        <main id="main-content" className="container-page py-8 pb-24 md:pb-8">
          {children}
        </main>
        <AdminMobileBar />
      </div>
    </div>
  );
}
