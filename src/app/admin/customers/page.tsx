import { getAllCustomers, getCurrentUserProfile } from "@/lib/queries";
import { CustomersManager } from "@/components/admin/customers-manager";

export default async function AdminCustomersPage() {
  const [customers, currentProfile] = await Promise.all([
    getAllCustomers(),
    getCurrentUserProfile(),
  ]);

  return (
    <CustomersManager
      customers={customers}
      currentUserRole={currentProfile?.role || "customer"}
      currentUserId={currentProfile?.id || ""}
    />
  );
}