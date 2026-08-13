import {
  DashboardSidebar,
  DashboardTopBar,
  DashboardMobileBar,
} from "@/components/navigation/DashboardNav";
import { getCurrentProfile } from "@/lib/practices/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="md:flex">
      <DashboardSidebar isAdmin={isAdmin} />
      <div className="flex-1 min-w-0">
        <DashboardTopBar isAdmin={isAdmin} />
        <main id="main-content" className="container-page py-8 pb-24 md:pb-8">
          {children}
        </main>
        <DashboardMobileBar />
      </div>
    </div>
  );
}
