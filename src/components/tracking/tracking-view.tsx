"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Package,
  PackageCheck,
  Radio,
  Search,
  ShieldCheck,
  Ship,
  Trash2,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { computeSteps, type TrackingStep } from "@/lib/tracking-steps";
import { deleteTrackingEvent } from "@/app/actions/tracking";
import type { OrderTracking, TrackingEvent } from "@/lib/tracking";

const STAGE_ICONS: Record<string, LucideIcon> = {
  placed: Package,
  confirmed: BadgeCheck,
  paid: CreditCard,
  deposit_paid: CreditCard,
  sourcing: Search,
  quality_check: ShieldCheck,
  packed: PackageCheck,
  shipment_created: Ship,
  shipped: Ship,
  in_transit: Truck,
  customs: Landmark,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  exception: AlertTriangle,
  cancelled: XCircle,
  update: MessageSquareText,
};

const STEP_ICONS: Record<TrackingStep, LucideIcon> = {
  placed: Package,
  paid: CreditCard,
  sourcing: Search,
  quality_check: ShieldCheck,
  shipped: Ship,
  customs: Landmark,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

export function TrackingView({
  data,
  mode,
  live = false,
}: {
  data: OrderTracking;
  /** public: no account (no live updates); customer: own order; staff: all events, can delete updates. */
  mode: "public" | "customer" | "staff";
  live?: boolean;
}) {
  const router = useRouter();
  const { t, format, formatDate, formatTime } = useI18n();
  const T = t.tracking;
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const stages = data.events.map((e) => e.stage);
  const { steps, cancelled, problem } = computeSteps(stages);
  const current = steps.find((s) => s.current);
  const lastDone = [...steps].reverse().find((s) => s.done);
  const headline = cancelled ? T.stages.cancelled : problem ? T.stages.exception : T.steps[(lastDone ?? steps[0]).step];
  const countryLabel = (c: string | null) => (c ? ((t.shop.countries as Record<string, string>)[c] ?? c) : null);
  const destination = [data.destination.city, countryLabel(data.destination.country)].filter(Boolean).join(", ");

  // Live: refresh whenever a tracking event is added for this order.
  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`tracking-${data.orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_tracking_events", filter: `order_id=eq.${data.orderId}` },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [live, data.orderId, router]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard blocked
    }
  }

  function eventTitle(e: TrackingEvent) {
    if (e.stage === "update") return (e.data.label as string) || T.stages.update;
    if (e.stage === "shipment_created") return format(T.stages.shipment_created, { carrier: String(e.data.carrier ?? "") });
    return (T.stages as Record<string, string>)[e.stage] ?? e.stage;
  }

  function removeEvent(e: TrackingEvent) {
    if (!window.confirm(T.staff.confirmDelete)) return;
    startTransition(async () => {
      await deleteTrackingEvent(data.orderId, e.id);
      router.refresh();
    });
  }

  const history = [...data.events].reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-disabled">{T.orderNumber}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{data.orderNumber}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {format(T.placedOn, { date: formatDate(data.createdAt, { day: "numeric", month: "long", year: "numeric" }) })}
              {destination && (
                <>
                  {" · "}
                  <MapPin className="-mt-0.5 inline h-3.5 w-3.5" /> {destination}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {live && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <Radio className="h-3.5 w-3.5" /> {T.live}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-semibold",
                cancelled || problem
                  ? "bg-error/10 text-error"
                  : steps[steps.length - 1].done
                    ? "bg-success/10 text-success"
                    : "bg-brand-light text-brand"
              )}
            >
              {headline}
            </span>
          </div>
        </div>

        {/* Journey */}
        {!cancelled && (
          <div className="border-t border-border px-5 py-6 sm:px-6">
            {/* Desktop: horizontal */}
            <ol className="hidden md:flex">
              {steps.map((s, i) => {
                const Icon = STEP_ICONS[s.step];
                return (
                  <li key={s.step} className="relative flex flex-1 flex-col items-center text-center">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2",
                          s.done || s.current ? "bg-brand" : "bg-border"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        s.done
                          ? "border-brand bg-brand text-white"
                          : s.current
                            ? "border-brand bg-surface text-brand shadow-[0_0_0_6px_rgb(214_40_40/0.12)]"
                            : "border-border bg-surface text-text-disabled"
                      )}
                    >
                      {s.done ? <Check className="h-5 w-5" /> : <Icon className="h-4.5 w-4.5" />}
                    </span>
                    <span
                      className={cn(
                        "mt-2 px-1 text-xs font-medium leading-tight",
                        s.done || s.current ? "text-navy" : "text-text-disabled"
                      )}
                    >
                      {T.steps[s.step]}
                    </span>
                  </li>
                );
              })}
            </ol>
            {/* Mobile: vertical */}
            <ol className="space-y-0 md:hidden">
              {steps.map((s, i) => {
                const Icon = STEP_ICONS[s.step];
                return (
                  <li key={s.step} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < steps.length - 1 && (
                      <span
                        aria-hidden
                        className={cn("absolute left-4 top-8 h-[calc(100%-1.5rem)] w-0.5 -translate-x-1/2", s.done ? "bg-brand" : "bg-border")}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                        s.done
                          ? "border-brand bg-brand text-white"
                          : s.current
                            ? "border-brand bg-surface text-brand"
                            : "border-border bg-surface text-text-disabled"
                      )}
                    >
                      {s.done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <div className="pt-1">
                      <p className={cn("text-sm font-medium", s.done || s.current ? "text-navy" : "text-text-disabled")}>
                        {T.steps[s.step]}
                      </p>
                      {s.current && (
                        <p className="text-xs text-text-secondary">{(T.stageHints as Record<string, string>)[s.step]}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {current && (
              <p className="mt-5 hidden text-center text-sm text-text-secondary md:block">
                {(T.stageHints as Record<string, string>)[current.step]}
              </p>
            )}
          </div>
        )}

        {(cancelled || problem) && (
          <div className="flex items-start gap-3 border-t border-border bg-error/5 px-5 py-4 text-sm text-navy sm:px-6">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            {cancelled ? T.cancelled : T.problem}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* History */}
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-semibold text-navy">{T.history}</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-text-secondary">{T.noEvents}</p>
          ) : (
            <ol className="mt-5">
              {history.map((e, i) => {
                const Icon = STAGE_ICONS[e.stage] ?? MessageSquareText;
                const latest = i === 0;
                return (
                  <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < history.length - 1 && (
                      <span aria-hidden className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-px bg-border" />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        e.stage === "exception" || e.stage === "cancelled"
                          ? "bg-error/10 text-error"
                          : latest
                            ? "bg-brand text-white"
                            : "bg-surface-secondary text-text-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className={cn("text-sm font-semibold", latest ? "text-navy" : "text-text-primary")}>{eventTitle(e)}</p>
                        {!e.isPublic && (
                          <span className="rounded-full bg-gold-light px-2 py-0.5 text-[11px] font-medium text-navy">{T.internal}</span>
                        )}
                      </div>
                      {e.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                          <MapPin className="h-3 w-3" /> {e.location}
                        </p>
                      )}
                      {e.note && <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">{e.note}</p>}
                      <p className="mt-1 text-xs text-text-disabled">
                        {formatDate(e.createdAt, { day: "numeric", month: "short", year: "numeric" })} · {formatTime(e.createdAt)}
                      </p>
                    </div>
                    {mode === "staff" && e.source === "staff" && (
                      <button
                        onClick={() => removeEvent(e)}
                        aria-label={T.staff.delete}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-disabled hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="space-y-6">
          {/* Shipments */}
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <Ship className="h-4 w-4 text-brand" /> {T.shipment}
            </h2>
            {data.shipments.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">{T.noShipment}</p>
            ) : (
              <div className="mt-3 space-y-4">
                {data.shipments.map((s) => (
                  <dl key={s.id} className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-secondary">{T.carrier}</dt>
                      <dd className="font-medium text-text-primary">{s.carrier}</dd>
                    </div>
                    {s.trackingNumber && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">{T.trackingNumber}</dt>
                        <dd>
                          <button
                            onClick={() => copy(s.trackingNumber!)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-xs hover:bg-surface-secondary"
                            aria-label={`${T.copy} ${s.trackingNumber}`}
                          >
                            {s.trackingNumber}
                            {copied === s.trackingNumber ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-text-disabled" />}
                          </button>
                        </dd>
                      </div>
                    )}
                    {(s.actualDelivery || s.estimatedDelivery) && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-text-secondary">{s.actualDelivery ? T.status : T.eta}</dt>
                        <dd className="font-medium text-text-primary">
                          {s.actualDelivery
                            ? format(T.deliveredOn, { date: formatDate(s.actualDelivery, { day: "numeric", month: "short" }) })
                            : formatDate(s.estimatedDelivery!, { day: "numeric", month: "long", year: "numeric" })}
                        </dd>
                      </div>
                    )}
                    {s.trackingUrl && (
                      <a
                        href={s.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex h-10 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-navy hover:bg-surface-secondary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {format(T.trackOnCarrier, { carrier: s.carrier })}
                      </a>
                    )}
                  </dl>
                ))}
              </div>
            )}
          </section>

          {/* Items */}
          {data.items.length > 0 && (
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <h2 className="font-semibold text-navy">{T.items}</h2>
              <ul className="mt-3 space-y-3">
                {data.items.slice(0, 4).map((item, i) => (
                  <li key={`${item.name}-${i}`} className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-surface-secondary">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <Package className="m-3 h-5 w-5 text-text-disabled" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">{format(T.quantity, { n: item.quantity })}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {data.items.length > 4 && (
                <p className="mt-3 text-xs text-text-secondary">{format(T.moreItems, { n: data.items.length - 4 })}</p>
              )}
            </section>
          )}

          {mode !== "staff" && (
            <section className="rounded-[var(--radius-lg)] bg-navy p-5 text-white">
              <p className="font-semibold">{T.questions}</p>
              <Link
                href={mode === "customer" ? "/dashboard/messages" : "/login?redirect=/dashboard/messages"}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-navy hover:bg-white/90"
              >
                <MessageCircle className="h-4 w-4" /> {T.chat}
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
