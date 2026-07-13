import { redirect } from "next/navigation";
import { getCurrentUserProfile, isUserStaff } from "@/lib/queries";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isStaff = await isUserStaff();
  if (!isStaff) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const user = {
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || "",
    role: profile.role || "staff",
    avatarUrl: profile.avatar_url || null,
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}