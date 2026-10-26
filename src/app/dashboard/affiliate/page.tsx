import { getAffiliateDashboard } from "@/app/actions/affiliate";
import { AffiliateDashboardView, AffiliateJoin } from "@/components/affiliate/affiliate-dashboard";

export default async function AffiliatePage() {
  const data = await getAffiliateDashboard();
  return data ? <AffiliateDashboardView data={data} /> : <AffiliateJoin />;
}
