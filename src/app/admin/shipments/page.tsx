import { Truck, CheckCircle, Circle, MapPin, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { shipments, orders } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function AdminShipmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Shipments</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor and manage all shipments in transit.
        </p>
      </div>

      <div className="space-y-4">
        {shipments.map((shipment) => {
          const order = orders.find((o) => o.id === shipment.orderId);
          const completedCount = shipment.milestones.filter((m) => m.completed).length;
          const progress = Math.round((completedCount / shipment.milestones.length) * 100);
          const isDelivered = shipment.milestones.every((m) => m.completed);

          return (
            <Card key={shipment.id} className="overflow-hidden">
              <div className="p-4 border-b border-border bg-surface-secondary/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary">{order?.orderNumber || "—"}</h3>
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", isDelivered ? "bg-success/10 text-success border-success/20" : "bg-brand/10 text-brand border-brand/20")}>
                        {isDelivered ? "Delivered" : "In Transit"}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{shipment.carrier} · {shipment.trackingNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden min-w-[100px]">
                      <div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-brand shrink-0">{progress}%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center gap-6 overflow-x-auto">
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}