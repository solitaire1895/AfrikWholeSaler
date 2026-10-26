import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Truck,
  FileText,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Package,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import {
  getCurrentCustomer,
  getOrdersByCustomer,
  getShipmentsByCustomer,
  getQuotesByCustomer,
  getConversationsByCustomer,
} from "@/lib/queries";
import { formatPrice, cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { getI18n } from "@/i18n/server";

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

export default async function DashboardOverviewPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;
  const { t, format, formatDate } = await getI18n();
  const O = t.account.overview;
  const orderStatus = (s: string) => (t.status.order as Record<string, string>)[s] ?? s;
  const verification = (s: string) => (t.account.verification as Record<string, string>)[s] ?? s;

  const [orders, shipments, quoteRequests, conversations] = await Promise.all([
    getOrdersByCustomer(customer.id),
    getShipmentsByCustomer(customer.id),
    getQuotesByCustomer(customer.id),
    getConversationsByCustomer(customer.id),
  ]);

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const activeShipments = shipments.filter((s) =>
    s.milestones.some((m) => !m.completed)
  );
  const pendingQuotes = quoteRequests.filter(
    (q) => q.status === "Submitted" || q.status === "Under Review"
  );
  const unreadMessages = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );
  const totalSpent = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    {
      label: O.activeOrders,
      value: activeOrders.length,
      icon: ShoppingBag,
      color: "text-brand",
      bg: "bg-brand-light",
    },
    {
      label: O.inTransit,
      value: activeShipments.length,
      icon: Truck,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: O.pendingQuotes,
      value: pendingQuotes.length,
      icon: FileText,
      color: "text-gold",
      bg: "bg-gold-light",
    },
    {
      label: O.unreadMessages,
      value: unreadMessages,
      icon: MessageCircle,
      color: "text-navy",
      bg: "bg-navy/5",
    },
  ];

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {format(O.welcome, { name: customer.firstName })}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {O.lead}
          </p>
        </div>
        <ButtonLink href="/quote" variant="primary" size="md">
          <FileText className="h-4 w-4" />
          {O.requestQuote}
        </ButtonLink>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)]",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{stat.value}</p>
            <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Total Spent & Verification Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-success" />
            <h3 className="text-sm font-semibold text-navy">{O.totalSpent}</h3>
          </div>
          <p className="text-3xl font-bold text-navy">
            {formatPrice(totalSpent)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {format(O.acrossOrders, { n: orders.length })}
          </p>
        </Card>

        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <h3 className="text-sm font-semibold text-navy">
              {O.accountStatus}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              {verification(customer.verificationStatus)}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {format(O.memberSince, { date: formatDate(customer.createdAt, { year: "numeric", month: "long" }) })}
          </p>
        </Card>

        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">{O.delivered}</h3>
          </div>
          <p className="text-3xl font-bold text-navy">
            {deliveredOrders.length}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {O.completed}
          </p>
        </Card>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">{O.recentOrders}</h2>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            {O.viewAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <Card key={order.id} hover className="p-4">
                <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2 mb-1">
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
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-navy">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(order.createdAt, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                {O.noOrders}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Active Shipments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shipments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">{O.activeShipments}</h2>
            <Link
              href="/dashboard/shipments"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {O.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeShipments.length > 0 ? (
              activeShipments.map((shipment) => {
                const order = orders.find((o) => o.id === shipment.orderId);
                const completedCount = shipment.milestones.filter(
                  (m) => m.completed
                ).length;
                const progress = Math.round(
                  (completedCount / shipment.milestones.length) * 100
                );
                return (
                  <Card key={shipment.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {order?.orderNumber || "—"}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {shipment.carrier} · {shipment.trackingNumber}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-text-secondary">
                        {format(O.estimated, { date: shipment.estimatedDelivery })}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-secondary">
                        {format(O.milestones, { done: completedCount, total: shipment.milestones.length })}
                      </span>
                      <span className="text-xs font-medium text-brand">
                        {progress}%
                      </span>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-8 text-center">
                <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                <p className="text-sm text-text-secondary">
                  {O.noShipments}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-navy mb-4">{O.quickActions}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/products"
              className="group flex flex-col items-start gap-2 p-5 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand">
                {O.qaBrowse}
              </p>
              <p className="text-xs text-text-secondary">
                {O.qaBrowseText}
              </p>
            </Link>
            <Link
              href="/quote"
              className="group flex flex-col items-start gap-2 p-5 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-gold-light text-gold">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand">
                {O.qaQuote}
              </p>
              <p className="text-xs text-text-secondary">
                {O.qaQuoteText}
              </p>
            </Link>
            <Link
              href="/dashboard/messages"
              className="group flex flex-col items-start gap-2 p-5 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-navy/5 text-navy">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand">
                {O.qaMessages}
              </p>
              <p className="text-xs text-text-secondary">
                {unreadMessages > 0 ? format(O.qaUnread, { n: unreadMessages }) : O.qaChat}
              </p>
            </Link>
            <Link
              href="/dashboard/profile"
              className="group flex flex-col items-start gap-2 p-5 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-success/10 text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-brand">
                {O.qaProfile}
              </p>
              <p className="text-xs text-text-secondary">
                {O.qaProfileText}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}