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
  orders,
  quoteRequests,
  products,
  conversations,
  shipments,
} from "@/lib/data";
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

export default function AdminOverviewPage() {
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingQuotes = quoteRequests.filter(
    (q) => q.status === "Submitted" || q.status === "Under Review"
  );
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );
  const activeShipments = shipments.filter((s) =>
    s.milestones.some((m) => !m.completed)
  );
  const unreadMessages = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
      change: "+12.5%",
    },
    {
      label: "Active Orders",
      value: activeOrders.length.toString(),
      icon: ShoppingBag,
      color: "text-brand",
      bg: "bg-brand-light",
      change: "+3",
    },
    {
      label: "Pending Quotes",
      value: pendingQuotes.length.toString(),
      icon: FileText,
      color: "text-gold",
      bg: "bg-gold-light",
      change: "+2",
    },
    {
      label: "Total Customers",
      value: "3,547",
      icon: Users,
      color: "text-info",
      bg: "bg-info/10",
      change: "+89",
    },
  ];

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

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
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </span>
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
                {activeShipments.length}
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
              <p className="text-xl font-bold text-navy">{products.length}</p>
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
              <p className="text-xl font-bold text-navy">{unreadMessages}</p>
              <p className="text-xs text-text-secondary">Unread Messages</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-warning/10 text-warning">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">2</p>
              <p className="text-xs text-text-secondary">Alerts</p>
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
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-4 hover:bg-surface-secondary/30 transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                    <Image
                      src={order.items[0].productImage}
                      alt={order.items[0].productName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {order.items[0].productName}
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
              ))}
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
              {quoteRequests.map((quote) => (
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
              ))}
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