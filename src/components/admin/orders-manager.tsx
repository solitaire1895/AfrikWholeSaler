"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Package, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/crud";
import { confirmOrderPrice } from "@/app/actions/cart";
import type { Order, OrderStatus, Customer } from "@/types";
import { useI18n } from "@/i18n/client";

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
  // Status picked in this session, shown right away while the server catches up.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const router = useRouter();
  const { t, format, formatDate } = useI18n();
  const A = t.admin.orders;
  const statusLabel = (st: string) => (t.status.order as Record<string, string>)[st] ?? st;

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const statusOf = (o: Order) => statusOverrides[o.id] ?? o.status;

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All" && statusOf(o) !== statusFilter) return false;
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

  // "Price on request" orders: staff enter the final total so the customer can pay.
  function handleSetPrice(orderId: string, raw: string) {
    const amount = Number(raw.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(A.invalidTotal);
      return;
    }
    startTransition(async () => {
      const result = await confirmOrderPrice(orderId, amount);
      if (!result.success) setError(result.error || t.admin.common.failed);
      else window.location.reload();
    });
  }

  function handleStatusChange(order: Order, newStatus: OrderStatus) {
    const previous = statusOf(order);
    if (newStatus === previous) return;
    setError(null);
    setSavingId(order.id);
    setStatusOverrides((s) => ({ ...s, [order.id]: newStatus }));
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, dbStatusMap[newStatus]);
      if (!result.success) {
        setStatusOverrides((s) => ({ ...s, [order.id]: previous }));
        setError(result.error || t.admin.common.failed);
      } else {
        router.refresh();
      }
      setSavingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">{A.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {A.lead}
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
            placeholder={A.search}
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
              {s === "All" ? t.admin.common.allStatuses : statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">{A.colOrder}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">{A.colCustomer}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">{A.colItems}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">{A.colTotal}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">{t.admin.common.status}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">{A.colDate}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">{t.admin.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((order) => {
                  const customer = customerMap.get(order.customerId);
                  return (
                    <tr key={order.id} className="hover:bg-surface-secondary/30">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-brand hover:underline">
                          {order.orderNumber}
                        </Link>
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
                          <span className="text-sm text-text-secondary">{format(A.items, { n: order.items.length })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.awaitingPrice ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem("total") as HTMLInputElement;
                              handleSetPrice(order.id, input.value);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              name="total"
                              inputMode="decimal"
                              placeholder={A.totalPlaceholder}
                              aria-label={format(A.setTotalFor, { order: order.orderNumber })}
                              className="h-8 w-24 rounded-[var(--radius-sm)] border border-gold/40 bg-gold-light px-2 text-xs focus:border-brand focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={isPending}
                              className="h-8 rounded-[var(--radius-sm)] bg-navy px-2.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {A.setPrice}
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm font-bold text-navy">{formatPrice(order.totalAmount, order.currency)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", statusColors[statusOf(order)])}>
                          {statusLabel(statusOf(order))}
                        </span>
                        {order.paymentStatus === "partial" && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-gold-light px-2 py-0.5 text-xs font-semibold text-navy">
                            {(t.status.payment as Record<string, string>).partial}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-text-secondary">
                          {formatDate(order.createdAt, { month: "short", day: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {savingId === order.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
                          <select
                            value={statusOf(order)}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            disabled={savingId === order.id}
                            aria-label={`${A.updateStatus} — ${order.orderNumber}`}
                            className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs font-medium text-text-primary focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            {allStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">{A.none}</p>
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