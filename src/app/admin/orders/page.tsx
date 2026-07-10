"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { orders } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

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

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (search.trim())
      return o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage all customer orders.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search orders..."
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
          {[
            "All",
            "Pending",
            "Confirmed",
            "Sourcing",
            "Quality Check",
            "Shipped",
            "In Customs",
            "Delivered",
            "Cancelled",
          ].map((s) => (
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                  Items
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-surface-secondary/30"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-primary">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {order.customerId}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                        <Image
                          src={order.items[0].productImage}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm text-text-secondary">
                        {order.items.length} items
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-navy">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                        statusColors[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary">
                      <Download className="h-3 w-3" /> Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}