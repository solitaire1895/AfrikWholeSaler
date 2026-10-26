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
  CreditCard,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { payOrder } from "@/app/actions/payments";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import { balanceDue, canPayDeposit, depositAmount } from "@/lib/deposit";
import type { Order, OrderStatus } from "@/types";
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

function PayButton({ failed, label, secondary }: { failed?: boolean; label?: string; secondary?: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] px-4 text-xs font-semibold transition-colors disabled:opacity-60",
        secondary ? "border border-border text-navy hover:bg-surface-secondary" : "bg-brand text-white hover:bg-brand-hover"
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      {label ?? (failed ? t.account.orders.retryPayment : t.account.orders.payButton)}
    </button>
  );
}

export function OrdersList({
  orders,
  placed,
  paidWithWallet,
}: {
  orders: Order[];
  placed?: string;
  paidWithWallet?: boolean;
}) {
  const { t, format, formatDate } = useI18n();
  const O = t.account.orders;
  const orderStatus = (s: string) => (t.status.order as Record<string, string>)[s] ?? s;
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
      {placed && (
        <div
          role="status"
          className="flex animate-[fade-in-up_0.5s_ease-out] items-start gap-3 rounded-[var(--radius-lg)] border border-success/20 bg-success/10 p-4"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-semibold text-navy">{format(O.placedTitle, { order: placed })}</p>
            <p className="mt-0.5 text-text-secondary">
              {paidWithWallet ? O.paidWithWallet : O.payNow}
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {O.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {O.lead}
          </p>
        </div>
        <ButtonLink href="/products" variant="secondary" size="md">
          <Package className="h-4 w-4" />
          {O.browse}
        </ButtonLink>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder={O.search}
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
              {s === "All" ? O.allStatuses : orderStatus(s)}
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
                        {orderStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {format(order.items.length === 1 ? O.itemLine : O.itemsLine, {
                        n: order.items.length,
                        name: order.items[0]?.productName ?? "",
                      })}
                      {order.items.length > 1 && format(O.more, { n: order.items.length - 1 })}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-navy">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(order.createdAt)}
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
                        {O.items}
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
                              {format(O.unitsTimes, { n: item.quantity, price: formatPrice(item.unitPrice) })}
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
                          <span className="text-text-secondary">{O.orderTotal}</span>
                          <span className="font-bold text-navy">
                            {formatPrice(order.totalAmount, order.currency)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {format(O.placedOn, { date: formatDate(order.createdAt, { year: "numeric", month: "long", day: "numeric" }) })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.paymentStatus === "paid" ? (
                          <span className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-success/10 px-4 text-xs font-semibold text-success">
                            <CreditCard className="h-3.5 w-3.5" />
                            {O.paid}
                          </span>
                        ) : order.awaitingPrice ? (
                          <span
                            title={O.awaitingPriceHint}
                            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-gold-light px-4 text-xs font-semibold text-navy"
                          >
                            <Clock className="h-3.5 w-3.5 text-gold" />
                            {O.awaitingPrice}
                          </span>
                        ) : (
                          order.status !== "Cancelled" &&
                          (canPayDeposit(order) ? (
                            // Big order: 30% now, or everything at once.
                            <>
                              <form action={payOrder.bind(null, order.id, "deposit")}>
                                <PayButton label={format(O.payDeposit, { amount: formatPrice(depositAmount(order), order.currency) })} />
                              </form>
                              <form action={payOrder.bind(null, order.id, "full")}>
                                <PayButton secondary label={O.payFull} />
                              </form>
                            </>
                          ) : (order.amountPaid ?? 0) > 0 ? (
                            // Deposit paid: the balance is due before shipping.
                            <>
                              <span className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-success/10 px-4 text-xs font-semibold text-success">
                                <CreditCard className="h-3.5 w-3.5" />
                                {O.depositPaid}
                              </span>
                              <form action={payOrder.bind(null, order.id, "full")}>
                                <PayButton label={format(O.payBalance, { amount: formatPrice(balanceDue(order), order.currency) })} />
                              </form>
                            </>
                          ) : (
                            <form action={payOrder.bind(null, order.id, "full")}>
                              <PayButton failed={order.paymentStatus === "failed"} />
                            </form>
                          ))
                        )}
                        <a
                          href={`/api/invoices/${order.id}?download=1`}
                          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {order.paymentStatus === "paid" ? O.invoice : O.proforma}
                        </a>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          {O.track}
                        </Link>
                        <Link
                          href="/dashboard/messages"
                          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {O.support}
                        </Link>
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
          <h3 className="text-lg font-semibold text-navy mb-1">{O.emptyTitle}</h3>
          <p className="text-text-secondary text-sm mb-4">
            {search || statusFilter !== "All"
              ? O.emptyFiltered
              : O.emptyText}
          </p>
          <ButtonLink href="/products" variant="primary" size="md">
            {O.browse}
          </ButtonLink>
        </Card>
      )}
    </div>
  );
}