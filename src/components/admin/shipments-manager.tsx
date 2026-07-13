"use client";

import { useState, useTransition } from "react";
import { Truck, CheckCircle, Circle, MapPin, X, Plus, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateShipmentStatus } from "@/app/actions/crud";
import type { Shipment, Order } from "@/types";

const shipmentStatuses = [
  { value: "preparing", label: "Preparing" },
  { value: "sourced", label: "Sourced" },
  { value: "in_transit", label: "In Transit" },
  { value: "customs", label: "In Customs" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

const milestoneOptions = [
  { status: "Sourced", location: "Shenzhen, China" },
  { status: "Quality Check Passed", location: "Shenzhen, China" },
  { status: "Departed Origin", location: "Shenzhen, China" },
  { status: "In Transit", location: "International Waters" },
  { status: "Arrived at Destination", location: "Destination Port" },
  { status: "In Customs", location: "Destination Customs" },
  { status: "Out for Delivery", location: "Local Distribution Center" },
  { status: "Delivered", location: "Customer Address" },
];

interface ShipmentsManagerProps {
  shipments: Shipment[];
  orders: Order[];
}

export function ShipmentsManager({ shipments, orders }: ShipmentsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);

  const orderMap = new Map(orders.map((o) => [o.id, o]));

  function handleStatusUpdate(shipmentId: string, status: string) {
    setOpenDropdown(null);
    startTransition(async () => {
      const result = await updateShipmentStatus(shipmentId, status);
      if (!result.success) {
        setError(result.error || "Failed to update shipment status");
      } else {
        window.location.reload();
      }
    });
  }

  function handleAddMilestone(formData: FormData) {
    const shipmentId = addingMilestone!;
    const milestoneStatus = formData.get("milestoneStatus") as string;
    const milestoneLocation = formData.get("milestoneLocation") as string;
    const milestoneNote = formData.get("milestoneNote") as string;

    const milestone = {
      status: milestoneStatus,
      location: milestoneLocation,
      ...(milestoneNote ? { note: milestoneNote } : {}),
    };

    // Map milestone status to shipment status
    const statusMap: Record<string, string> = {
      "Sourced": "sourced",
      "Quality Check Passed": "sourced",
      "Departed Origin": "in_transit",
      "In Transit": "in_transit",
      "Arrived at Destination": "in_transit",
      "In Customs": "customs",
      "Out for Delivery": "out_for_delivery",
      "Delivered": "delivered",
    };

    startTransition(async () => {
      const result = await updateShipmentStatus(shipmentId, statusMap[milestoneStatus] || "in_transit", milestone);
      if (result.success) {
        setAddingMilestone(null);
        window.location.reload();
      } else {
        setError(result.error || "Failed to add milestone");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Shipments</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor and manage all shipments in transit.
        </p>
      </div>

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
                          {isDelivered ? "Delivered" : "In Transit"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{shipment.carrier} · {shipment.trackingNumber || "No tracking"}</p>
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
                          Update
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdown === shipment.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-[var(--radius-sm)] border border-border bg-surface shadow-[var(--shadow-card)] py-1">
                            {shipmentStatuses.map((s) => (
                              <button
                                key={s.value}
                                onClick={() => handleStatusUpdate(shipment.id, s.value)}
                                className="flex w-full items-center px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                              >
                                {s.label}
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
                          <p className={cn("text-xs font-medium", m.completed ? "text-text-primary" : "text-text-secondary")}>{m.status}</p>
                          <p className="text-xs text-text-disabled flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{m.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isDelivered && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => setAddingMilestone(addingMilestone === shipment.id ? null : shipment.id)}
                        className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-brand-light px-3 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Milestone
                      </button>
                    </div>
                  )}

                  {addingMilestone === shipment.id && (
                    <form action={handleAddMilestone} className="mt-3 pt-3 border-t border-border space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Milestone</label>
                          <select
                            name="milestoneStatus"
                            required
                            className="w-full h-9 rounded-[var(--radius-input)] border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none cursor-pointer"
                          >
                            {milestoneOptions.map((m) => (
                              <option key={m.status} value={m.status}>{m.status}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                          <input
                            type="text"
                            name="milestoneLocation"
                            required
                            placeholder="City, Country"
                            className="w-full h-9 rounded-[var(--radius-input)] border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Note (optional)</label>
                        <input
                          type="text"
                          name="milestoneNote"
                          placeholder="Additional details..."
                          className="w-full h-9 rounded-[var(--radius-input)] border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingMilestone(null)}
                          className="flex h-8 items-center rounded-[var(--radius-button)] border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex h-8 items-center gap-1.5 rounded-[var(--radius-button)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                        >
                          {isPending ? "Adding..." : "Add Milestone"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Truck className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No shipments found.</p>
        </Card>
      )}
    </div>
  );
}