import { getAllStaff, getAllProfiles, getCurrentUserProfile } from "@/lib/queries";
import { StaffManager } from "@/components/admin/staff-manager";

export default async function AdminStaffPage() {
  const [staff, profiles, currentProfile] = await Promise.all([
    getAllStaff(),
    getAllProfiles(),
    getCurrentUserProfile(),
  ]);

  return (
    <StaffManager
      staff={staff}
      profiles={profiles}
      currentUserRole={currentProfile?.role || "staff"}
    />
  );
}