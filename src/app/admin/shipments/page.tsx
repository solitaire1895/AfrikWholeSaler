import { getAllShipments, getAllOrders } from "@/lib/queries";
import { ShipmentsManager } from "@/components/admin/shipments-manager";

export default async function AdminShipmentsPage() {
  const [shipments, orders] = await Promise.all([
    getAllShipments(),
    getAllOrders(),
  ]);

  return <ShipmentsManager shipments={shipments} orders={orders} />;
}