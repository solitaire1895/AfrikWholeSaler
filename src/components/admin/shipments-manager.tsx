"use client";

import { useState, useTransition } from "react";
import { Truck, CheckCircle, Circle, MapPin, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewShipmentDialog } from "@/components/admin/new-shipment-dialog";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateShipmentStatus } from "@/app/actions/crud";
import type { Shipment, Order } from "@/types";
import { useT } from "@/i18n/client";

const shipmentStatuses = ["preparing", "packed", "dispatched", "in_transit", "customs", "out_for_delivery", "delivered", "exception"] as const;

interface ShipmentsManagerProps {
  shipments: Shipment[];
  orders: Order[];
}

export function ShipmentsManager({ shipments, orders }: ShipmentsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<{ text: string; orderId: string } | null>(null);
  const router = useRouter();
  const t = useT();
  const S = t.admin.shipments;
  const C = t.admin.common;
  // Milestones are stored in English; show them in the current language.
  const milestoneLabel = (m: string) => (S.milestones as Record<string, string>)[m] ?? m;

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  // Orders that can still get a shipment: none yet, not cancelled or delivered.
  const shippedOrderIds = new Set(shipments.map((s) => s.orderId));
  const shippableOrders = orders.filter(
    (o) => !shippedOrderIds.has(o.id) && o.status !== "Cancelled" && o.status !== "Delivered"
  );

  const newShipmentButton = (
    <button
      onClick={() => setCreating(true)}
      className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
    >
      <Plus className="h-4 w-4" />
      {S.newShipment}
    </button>
  );

  function handleStatusUpdate(shipmentId: string, status: string) {
    setOpenDropdown(null);
    startTransition(async () => {
      const result = await updateShipmentStatus(shipmentId, status);
      if (!result.success) {
        setError(result.error || C.failed);
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">{S.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {S.lead}
          </p>
        </div>
        {newShipmentButton}
      </div>

      {creating && (
        <NewShipmentDialog
          orders={shippableOrders}
          onClose={() => setCreating(false)}
          onCreated={(orderId) => {
            setCreating(false);
            setNotice({ text: S.created, orderId });
            router.refresh();
          }}
        />
      )}

      {notice && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {notice.text}
          <Link href={`/admin/orders/${notice.orderId}`} className="font-semibold underline-offset-2 hover:underline">
            {S.openOrder} →
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {shipments.length > 0 ? (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const order = orderMap.get(shipment.orderId);
            const completedCount = shipment.milestones.filter((m) => m.completed).length;
            const progress = shipment.milestones.length > 0 ? Math.round((completedCount / shipment.milestones.length) * 100) : 0;
            const isDelivered = shipment.milestones.length > 0 && shipment.milestones.every((m) => m.completed);

            return (
              <Card key={shipment.id} className="overflow-hidden">
                <div className="p-4 border-b border-border bg-surface-secondary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">{order?.orderNumber || shipment.orderId.slice(0, 8)}</h3>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", isDelivered ? "bg-success/10 text-success border-success/20" : "bg-brand/10 text-brand border-brand/20")}>
                          {isDelivered ? S.delivered : S.inTransit}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{shipment.carrier} · {shipment.trackingNumber || S.noTracking}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden min-w-[100px]">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-brand shrink-0">{progress}%</span>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === shipment.id ? null : shipment.id)}
                          disabled={isPending}
                          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-50"
                        >
                          {S.update}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdown === shipment.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-[var(--radius-sm)] border border-border bg-surface shadow-[var(--shadow-card)] py-1">
                            {shipmentStatuses.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusUpdate(shipment.id, s)}
                                className="flex w-full items-center px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                              >
                                {S.statuses[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-6 overflow-x-auto pb-2">
                    {shipment.milestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 shrink-0">
                        {m.completed ? (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-border shrink-0" />
                        )}
                        <div>
                          <p className={cn("text-xs font-medium", m.completed ? "text-text-primary" : "text-text-secondary")}>{milestoneLabel(m.status)}</p>
                          <p className="text-xs text-text-disabled flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{m.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {shipment.orderId && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Link
                        href={`/admin/orders/${shipment.orderId}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-brand-light px-3 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t.tracking.staff.postTitle}
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Truck className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary">{S.none}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">{S.emptyHint}</p>
          <div className="mt-5 flex justify-center">{newShipmentButton}</div>
        </Card>
      )}
    </div>
  );
}