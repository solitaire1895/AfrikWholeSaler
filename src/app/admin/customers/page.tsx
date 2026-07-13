import { getAllCustomers } from "@/lib/queries";
import { CustomersManager } from "@/components/admin/customers-manager";

export default async function AdminCustomersPage() {
  const customers = await getAllCustomers();
  return <CustomersManager customers={customers} />;
}