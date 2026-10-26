import Link from "next/link";
import {
  Truck,
  CheckCircle,
  Circle,
  Clock,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getCurrentCustomer,
  getShipmentsByCustomer,
  getOrdersByCustomer,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export default async function ShipmentsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const [shipments, orders] = await Promise.all([
    getShipmentsByCustomer(customer.id),
    getOrdersByCustomer(customer.id),
  ]);
  const { t, format, formatDate } = await getI18n();
  const S = t.account.shipments;
  const milestoneName = (s: string) => (t.status.shipment as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          {S.title}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {S.lead}
        </p>
      </div>

      {/* Shipments */}
      {shipments.length > 0 ? (
        <div className="space-y-6">
          {shipments.map((shipment) => {
            const order = orders.find((o) => o.id === shipment.orderId);
            const completedCount = shipment.milestones.filter(
              (m) => m.completed
            ).length;
            const progress = Math.round(
              (completedCount / shipment.milestones.length) * 100
            );
            const currentMilestone = shipment.milestones.find(
              (m) => !m.completed
            );
            const isDelivered = shipment.milestones.every(
              (m) => m.completed
            );

            return (
              <Card key={shipment.id} className="overflow-hidden">
                {/* Shipment Header */}
                <div className="p-5 border-b border-border bg-surface-secondary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text-primary">
                          {order?.orderNumber || "—"}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            isDelivered
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-brand/10 text-brand border-brand/20"
                          )}
                        >
                          {isDelivered ? S.delivered : S.inTransit}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {shipment.carrier} · {shipment.trackingNumber}
                      </p>
                    </div>
                    {shipment.orderId && (
                      <Link
                        href={`/dashboard/orders/${shipment.orderId}`}
                        className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {t.tracking.trackOrder}
                      </Link>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-brand shrink-0">
                      {progress}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-secondary">
                      {format(S.milestones, { done: completedCount, total: shipment.milestones.length })}
                    </span>
                    <span className="text-xs font-medium text-text-secondary">
                      {format(S.estimated, { date: shipment.estimatedDelivery })}
                    </span>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-text-disabled uppercase tracking-wide mb-4">
                    {S.timeline}
                  </h4>
                  <div className="space-y-0">
                    {shipment.milestones.map((milestone, idx) => {
                      const isLast = idx === shipment.milestones.length - 1;
                      return (
                        <div
                          key={idx}
                          className="flex gap-4"
                        >
                          {/* Timeline Line & Dot */}
                          <div className="flex flex-col items-center">
                            {milestone.completed ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 shrink-0">
                                <CheckCircle className="h-5 w-5 text-success" />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-surface shrink-0">
                                <Circle className="h-4 w-4 text-text-disabled" />
                              </div>
                            )}
                            {!isLast && (
                              <div
                                className={cn(
                                  "w-0.5 flex-1 min-h-[2.5rem]",
                                  milestone.completed
                                    ? "bg-success/30"
                                    : "bg-border"
                                )}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className={cn("flex-1", isLast && "pb-0", !isLast && "pb-6")}>
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  milestone.completed
                                    ? "text-text-primary"
                                    : "text-text-secondary"
                                )}
                              >
                                {milestoneName(milestone.status)}
                              </p>
                              {!milestone.completed &&
                                currentMilestone?.status === milestone.status && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                                    <Clock className="h-3 w-3" />
                                    {S.current}
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                              <MapPin className="h-3 w-3" />
                              {milestone.location}
                            </div>
                            {milestone.timestamp && (
                              <p className="text-xs text-text-disabled">
                                {formatDate(milestone.timestamp, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                            {!milestone.timestamp && !milestone.completed && (
                              <p className="text-xs text-text-disabled italic">
                                {S.pending}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Items Summary */}
                {order && (
                  <div className="px-5 pb-5">
                    <div className="rounded-[var(--radius-sm)] bg-surface-secondary/50 p-4">
                      <p className="text-xs font-semibold text-text-disabled uppercase tracking-wide mb-2">
                        {S.contents}
                      </p>
                      <p className="text-sm text-text-primary">
                        {format(order.items.length === 1 ? S.contentsLineOne : S.contentsLine, {
                          n: order.items.length,
                          list: order.items.map((i) => format(S.itemUnits, { name: i.productName, n: i.quantity })).join(", "),
                        })}
                      </p>
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
            <Truck className="h-8 w-8 text-text-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">
            {S.emptyTitle}
          </h3>
          <p className="text-text-secondary text-sm">
            {S.emptyText}
          </p>
        </Card>
      )}
    </div>
  );
}