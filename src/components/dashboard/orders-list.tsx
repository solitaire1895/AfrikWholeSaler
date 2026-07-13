"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

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

const statusFilters: (OrderStatus | "All")[] = [
  "All",
  "Pending",
  "Confirmed",
  "Sourcing",
  "Quality Check",
  "Shipped",
  "In Customs",
  "Delivered",
];

export function OrdersList({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== "All") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.items.some((i) => i.productName.toLowerCase().includes(query))
      );
    }

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [search, statusFilter, orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track and manage all your orders.
          </p>
        </div>
        <ButtonLink href="/products" variant="secondary" size="md">
          <Package className="h-4 w-4" />
          Browse Products
        </ButtonLink>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search by order number or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "All")}
          className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
        >
          {statusFilters.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            return (
              <Card key={order.id} className="overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : order.id)
                  }
                  className="w-full flex items-center gap-4 p-4 hover:bg-surface-secondary/50 transition-colors text-left"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                    {order.items[0]?.productImage ? (
                      <Image
                        src={order.items[0].productImage}
                        alt={order.items[0].productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-text-disabled" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">
                        {order.orderNumber}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                          statusColors[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"} ·{" "}
                      {order.items[0]?.productName}
                      {order.items.length > 1 &&
                        ` +${order.items.length - 1} more`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-navy">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-text-disabled shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-text-disabled shrink-0" />
                  )}
                </button>

                {/* Order Details (expanded) */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4 bg-surface-secondary/30">
                    {/* Items */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-text-disabled uppercase tracking-wide">
                        Items
                      </h4>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-surface border border-border"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-5 w-5 text-text-disabled" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {item.quantity} units × {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-navy shrink-0">
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Summary & Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-3 border-t border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-secondary">Order Total:</span>
                          <span className="font-bold text-navy">
                            {formatPrice(order.totalAmount, order.currency)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
                          <Download className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                        {order.status === "Shipped" ||
                        order.status === "In Customs" ? (
                          <Link
                            href="/dashboard/shipments"
                            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Track Shipment
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard/messages"
                            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Contact Support
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-text-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">No orders found</h3>
          <p className="text-text-secondary text-sm mb-4">
            {search || statusFilter !== "All"
              ? "Try adjusting your search or filters."
              : "Start by browsing our catalog or requesting a quote."}
          </p>
          <ButtonLink href="/products" variant="primary" size="md">
            Browse Products
          </ButtonLink>
        </Card>
      )}
    </div>
  );
}