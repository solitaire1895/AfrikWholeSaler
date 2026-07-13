import { getCurrentCustomer } from "@/lib/queries";
import { ProfileSettings } from "@/components/dashboard/profile-settings";

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return <ProfileSettings customer={customer} />;
}