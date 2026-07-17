import { getAllPurchaseRequests } from "@/lib/queries";
import { PurchaseRequestsManager } from "@/components/admin/purchase-requests-manager";

export default async function AdminPurchaseRequestsPage() {
  const purchaseRequests = await getAllPurchaseRequests();
  return <PurchaseRequestsManager purchaseRequests={purchaseRequests} />;
}