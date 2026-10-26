import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer, getCurrentUserProfile } from "@/lib/queries";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getT } from "@/i18n/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();

  if (!customer) {
    // Safety net: if customer auto-creation failed, check if user is staff
    const profile = await getCurrentUserProfile();
    if (profile) {
      // User is authenticated — redirect staff to /admin
      // For non-staff, render an error (redirecting to /login would loop
      // because the proxy sends authenticated users back to /dashboard)
      const staffRoles = [
        "sales_rep",
        "support_agent",
        "warehouse_staff",
        "logistics_staff",
        "operations_manager",
        "admin",
        "super_admin",
      ];
      if (staffRoles.includes(profile.role)) {
        redirect("/admin");
      }
      // Authenticated non-staff with no customer record — show error page
      const t = await getT();
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-navy mb-3">
              {t.account.shell.setupTitle}
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              {t.account.shell.setupText}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              {t.account.shell.backHome}
            </Link>
          </div>
        </div>
      );
    }
    // Truly unauthenticated — redirect to login
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const isAdmin = profile
    ? ["admin", "super_admin"].includes(profile.role)
    : false;

  return (
    <DashboardShell customer={customer} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
