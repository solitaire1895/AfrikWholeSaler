import {
  Truck,
  Package,
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  Search,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { shipments, orders } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Shipment Tracking
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track your shipments from sourcing to delivery.
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
                          {isDelivered ? "Delivered" : "In Transit"}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {shipment.carrier} · {shipment.trackingNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                      <button className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Track on {shipment.carrier.split(" ")[0]}
                      </button>
                    </div>
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
                      {completedCount} of {shipment.milestones.length} milestones
                      completed
                    </span>
                    <span className="text-xs font-medium text-text-secondary">
                      Est. delivery: {shipment.estimatedDelivery}
                    </span>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-text-disabled uppercase tracking-wide mb-4">
                    Shipment Timeline
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
                                {milestone.status}
                              </p>
                              {!milestone.completed &&
                                currentMilestone?.status === milestone.status && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                                    <Clock className="h-3 w-3" />
                                    Current
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                              <MapPin className="h-3 w-3" />
                              {milestone.location}
                            </div>
                            {milestone.timestamp && (
                              <p className="text-xs text-text-disabled">
                                {new Date(milestone.timestamp).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            )}
                            {!milestone.timestamp && !milestone.completed && (
                              <p className="text-xs text-text-disabled italic">
                                Pending
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
                        Order Contents
                      </p>
                      <p className="text-sm text-text-primary">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}:{" "}
                        {order.items
                          .map((i) => `${i.productName} (${i.quantity} units)`)
                          .join(", ")}
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
            No shipments yet
          </h3>
          <p className="text-text-secondary text-sm">
            Your shipments will appear here once your orders are shipped.
          </p>
        </Card>
      )}
    </div>
  );
}