import { getCurrentCustomer, getOrdersByCustomer } from "@/lib/queries";
import { OrdersList } from "@/components/dashboard/orders-list";

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await getOrdersByCustomer(customer.id);

  return <OrdersList orders={orders} />;
}