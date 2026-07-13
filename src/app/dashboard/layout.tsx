import { redirect } from "next/navigation";
import { getCurrentCustomer, getCurrentUserProfile } from "@/lib/queries";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-navy mb-3">
              Account Setup Incomplete
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              We couldn't load your customer profile. This may be a temporary
              issue. Please try refreshing the page, or contact support if the
              problem persists.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              Back to Home
            </a>
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
