import { getAllStaff } from "@/lib/queries";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const staff = await getAllStaff();
  return <StaffManager staff={staff} />;
}