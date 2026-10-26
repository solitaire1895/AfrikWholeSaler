import { getAffiliateAdminData } from "@/app/actions/affiliate";
import { AffiliatesManager } from "@/components/admin/affiliates-manager";
import { getT } from "@/i18n/server";

export default async function AdminAffiliatesPage() {
  const data = await getAffiliateAdminData();
  if (!data) {
    return (
      <p className="rounded-[var(--radius-md)] bg-surface p-6 text-sm text-text-secondary">
        {(await getT()).adminCatalog.affiliatesForbidden}
      </p>
    );
  }
  return <AffiliatesManager affiliates={data.affiliates} withdrawals={data.withdrawals} />;
}
