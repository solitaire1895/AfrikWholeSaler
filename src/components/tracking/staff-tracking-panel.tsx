"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Ship } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { addTrackingEvent, saveShipment } from "@/app/actions/tracking";
import { STAFF_STAGES, type StaffStage } from "@/lib/tracking-steps";
import type { TrackingShipment } from "@/lib/tracking";

const inputCls =
  "h-10 w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/** Staff tools on an order: create/edit the shipment and post tracking updates. */
export function StaffTrackingPanel({ orderId, shipment }: { orderId: string; shipment: TrackingShipment | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const T = t.tracking;
  const S = T.staff;
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"shipment" | "event" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Shipment form
  const [carrier, setCarrier] = useState(shipment?.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(shipment?.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(shipment?.trackingUrl ?? "");
  const [eta, setEta] = useState(shipment?.estimatedDelivery?.slice(0, 10) ?? "");

  // Update form
  const [stage, setStage] = useState<StaffStage>("update");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  function submitShipment(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy("shipment");
    startTransition(async () => {
      const res = await saveShipment(orderId, {
        shipmentId: shipment?.id,
        carrier,
        trackingNumber,
        trackingUrl,
        estimatedDelivery: eta || undefined,
      });
      setBusy(null);
      setMessage(res.success ? { ok: true, text: S.saved } : { ok: false, text: res.error });
      if (res.success) router.refresh();
    });
  }

  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy("event");
    startTransition(async () => {
      const res = await addTrackingEvent(orderId, { stage, location, note, isPublic, shipmentId: shipment?.id });
      setBusy(null);
      if (!res.success) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: isPublic ? S.posted : S.postedInternal });
      setLocation("");
      setNote("");
      setStage("update");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {message && (
        <p
          role="status"
          className={cn(
            "rounded-[var(--radius-sm)] border px-4 py-3 text-sm lg:col-span-2",
            message.ok ? "border-success/20 bg-success/10 text-success" : "border-error/20 bg-error/10 text-error"
          )}
        >
          {message.text}
        </p>
      )}

      {/* Post an update */}
      <form onSubmit={submitEvent} className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Send className="h-4 w-4 text-brand" /> {S.postTitle}
        </h2>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-secondary">{S.stage}</span>
          <select value={stage} onChange={(e) => setStage(e.target.value as StaffStage)} className={cn(inputCls, "cursor-pointer")}>
            {STAFF_STAGES.map((s) => (
              <option key={s} value={s}>
                {s === "shipped" ? T.steps.shipped : (T.stages as Record<string, string>)[s]}
              </option>
            ))}
          </select>
          {stage !== "update" && <span className="mt-1 block text-xs text-text-disabled">{S.stageHelp}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-secondary">{S.location}</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={S.locationPlaceholder} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-secondary">{S.note}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={S.notePlaceholder}
            rows={3}
            className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-border" />
          {S.visible}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {busy === "event" && <Loader2 className="h-4 w-4 animate-spin" />}
          {S.post}
        </button>
      </form>

      {/* Shipment */}
      <form onSubmit={submitShipment} className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 font-semibold text-navy">
          <Ship className="h-4 w-4 text-brand" /> {shipment ? `${S.editShipment} · ${shipment.shipmentNumber}` : S.createShipment}
        </h2>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-secondary">{S.carrier}</span>
          <input required value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder={S.carrierPlaceholder} className={inputCls} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">{S.trackingNumber}</span>
            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-secondary">{S.eta}</span>
            <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-secondary">{S.trackingUrl}</span>
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder={S.trackingUrlPlaceholder}
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
        >
          {busy === "shipment" && <Loader2 className="h-4 w-4 animate-spin" />}
          {shipment ? S.save : S.createShipment}
        </button>
      </form>
    </div>
  );
}
