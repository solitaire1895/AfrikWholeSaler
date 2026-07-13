import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Users,
  FileText,
  Truck,
  DollarSign,
  TrendingUp,
  Package,
  MessageCircle,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getAdminDashboardStats,
  getAllOrders,
  getAllQuotes,
} from "@/lib/queries";
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

export default async function AdminOverviewPage() {
  const [stats, orders, quoteRequests] = await Promise.all([
    getAdminDashboardStats(),
    getAllOrders(),
    getAllQuotes(),
  ]);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const recentQuotes = quoteRequests.slice(0, 5);

  const statsCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders.toString(),
      icon: ShoppingBag,
      color: "text-brand",
      bg: "bg-brand-light",
    },
    {
      label: "Pending Quotes",
      value: stats.pendingQuotes.toString(),
      icon: FileText,
      color: "text-gold",
      bg: "bg-gold-light",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-info",
      bg: "bg-info/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of platform activity and key metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
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

      {/* Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">
                {stats.activeShipments}
              </p>
              <p className="text-xs text-text-secondary">Active Shipments</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-navy/5 text-navy">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">{stats.totalProducts}</p>
              <p className="text-xs text-text-secondary">Products in Catalog</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-info/10 text-info">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">{stats.unreadMessages}</p>
              <p className="text-xs text-text-secondary">Open Conversations</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10 text-warning">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">
                {stats.pendingQuotes}
              </p>
              <p className="text-xs text-text-secondary">Quotes Needing Review</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders & Quote Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-4 hover:bg-surface-secondary/30 transition-colors"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                      {order.items[0]?.productImage ? (
                        <Image
                          src={order.items[0].productImage}
                          alt={order.items[0].productName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-5 w-5 text-text-disabled" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {order.items[0]?.productName || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-navy">
                        {formatPrice(order.totalAmount, order.currency)}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold",
                          statusColors[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No orders yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quote Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">Quote Queue</h2>
            <Link
              href="/admin/quotes"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center gap-3 p-4 hover:bg-surface-secondary/30 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-secondary">
                      <FileText className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {quote.productName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {quote.quantity.toLocaleString()} units ·{" "}
                        {quote.destinationCountry}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0",
                        quote.status === "Submitted"
                          ? "bg-info/10 text-info border-info/20"
                          : quote.status === "Under Review"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-brand/10 text-brand border-brand/20"
                      )}
                    >
                      {quote.status === "Under Review" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {quote.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No quote requests yet.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div>
        <h2 className="text-lg font-bold text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/admin/products", label: "Add Product", icon: Package },
            { href: "/admin/orders", label: "Manage Orders", icon: ShoppingBag },
            { href: "/admin/quotes", label: "Review Quotes", icon: FileText },
            { href: "/admin/customers", label: "Customers", icon: Users },
            { href: "/admin/staff", label: "Staff & Roles", icon: Users },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-text-primary text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}