"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Ship, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { saveShipment } from "@/app/actions/tracking";
import type { Order } from "@/types";

const inputCls =
  "h-10 w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/** Create a shipment for an order that doesn't have one yet. */
export function NewShipmentDialog({
  orders,
  onClose,
  onCreated,
}: {
  /** Orders that can receive a shipment. */
  orders: Order[];
  onClose: () => void;
  onCreated: (orderId: string) => void;
}) {
  const { t, formatDate } = useI18n();
  const S = t.admin.shipments;
  const F = t.tracking.staff;
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [eta, setEta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveShipment(orderId, { carrier, trackingNumber, trackingUrl, estimatedDelivery: eta || undefined });
      if (res.success) onCreated(orderId);
      else setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-shipment-title"
        className="w-full max-w-lg space-y-4 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="new-shipment-title" className="flex items-center gap-2 text-lg font-bold text-navy">
            <Ship className="h-5 w-5 text-brand" /> {S.newShipment}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.admin.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] bg-surface-secondary/60 p-4 text-sm text-text-secondary">{S.noOrdersLeft}</p>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">{S.order}</span>
              <select required value={orderId} onChange={(e) => setOrderId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="" disabled>
                  {S.chooseOrder}
                </option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} · {(t.status.order as Record<string, string>)[o.status] ?? o.status} ·{" "}
                    {formatDate(o.createdAt, { day: "numeric", month: "short" })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">{F.carrier}</span>
              <input required value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder={F.carrierPlaceholder} className={inputCls} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{F.trackingNumber}</span>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-text-secondary">{F.eta}</span>
                <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={inputCls} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-text-secondary">{F.trackingUrl}</span>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder={F.trackingUrlPlaceholder}
                className={inputCls}
              />
            </label>
            {error && <p className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary"
          >
            {t.admin.common.cancel}
          </button>
          {orders.length > 0 && (
            <button
              type="submit"
              disabled={pending || !orderId}
              className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {F.createShipment}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
