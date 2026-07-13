import { getCurrentUserProfile } from "@/lib/queries";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const settingsProfile = {
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || "",
    company: profile.company || null,
    phone: profile.phone || null,
    country: profile.country || null,
    avatarUrl: profile.avatar_url || null,
  };

  return <SettingsManager profile={settingsProfile} />;
}