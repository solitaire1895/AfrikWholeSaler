import { getAllOrders, getAllCustomers } from "@/lib/queries";
import { OrdersManager } from "@/components/admin/orders-manager";

export default async function AdminOrdersPage() {
  const [orders, customers] = await Promise.all([
    getAllOrders(),
    getAllCustomers(),
  ]);

  return <OrdersManager orders={orders} customers={customers} />;
}