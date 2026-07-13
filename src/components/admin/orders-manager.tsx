"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Search, Package, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/crud";
import type { Order, OrderStatus, Customer } from "@/types";

const statusColors: Record<OrderStatus, string> = {
  Pending: "bg-warning/10 text-warning border-warning/20",
  Confirmed: "bg-info/10 text-info border-info/20",
  Sourcing: "bg-info/10 text-info border-info/20",
  "Quality Check": "bg-info/10 text-info border-info/20",
  Shipped: "bg-brand/10 text-brand border-brand/20",
  "In Customs": "bg-warning/10 text-warning border-warning/20",
  Delivered: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-error/10 text-error border-error/20",
};

const allStatuses: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Sourcing",
  "Quality Check",
  "Shipped",
  "In Customs",
  "Delivered",
  "Cancelled",
];

// Map frontend status to DB status
const dbStatusMap: Record<OrderStatus, string> = {
  Pending: "pending",
  Confirmed: "confirmed",
  Sourcing: "processing",
  "Quality Check": "quality_check",
  Shipped: "shipped",
  "In Customs": "in_transit",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

interface OrdersManagerProps {
  orders: Order[];
  customers: Customer[];
}

export function OrdersManager({ orders, customers }: OrdersManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const customer = customerMap.get(o.customerId);
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (customer && `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(q)) ||
        (customer && customer.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setOpenDropdown(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, dbStatusMap[newStatus]);
      if (!result.success) {
        setError(result.error || "Failed to update order status");
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage all customer orders and update their status.
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
        >
          {["All", ...allStatuses].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((order) => {
                  const customer = customerMap.get(order.customerId);
                  return (
                    <tr key={order.id} className="hover:bg-surface-secondary/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-text-primary">{order.orderNumber}</p>
                        <p className="text-xs text-text-secondary">{order.customerId.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm text-text-primary">
                          {customer ? `${customer.firstName} ${customer.lastName}` : "—"}
                        </p>
                        <p className="text-xs text-text-secondary">{customer?.company || ""}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                            {order.items[0]?.productImage ? (
                              <Image src={order.items[0].productImage} alt="" fill sizes="32px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-4 w-4 text-text-disabled" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-text-secondary">{order.items.length} items</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-navy">{formatPrice(order.totalAmount, order.currency)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", statusColors[order.status])}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-text-secondary">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                          disabled={isPending}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-50"
                        >
                          Update Status
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdown === order.id && (
                          <div className="absolute right-4 top-full mt-1 z-10 w-44 rounded-[var(--radius-sm)] border border-border bg-surface shadow-[var(--shadow-card)] py-1">
                            {allStatuses.map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(order.id, status)}
                                className={cn(
                                  "flex w-full items-center px-3 py-2 text-xs font-medium hover:bg-surface-secondary transition-colors",
                                  order.status === status ? "text-brand" : "text-text-primary"
                                )}
                              >
                                {status}
                                {order.status === status && <span className="ml-auto">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">No orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}