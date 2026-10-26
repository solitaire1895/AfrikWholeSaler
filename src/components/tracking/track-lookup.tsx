"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PackageSearch } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { trackOrderPublic } from "@/app/actions/tracking";
import { TrackingView } from "@/components/tracking/tracking-view";
import type { OrderTracking } from "@/lib/tracking";

/** Public "Track my order": order number + email, no account needed. */
export function TrackLookup({ initialOrder = "" }: { initialOrder?: string }) {
  const { t } = useI18n();
  const T = t.tracking;
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await trackOrderPublic(orderNumber, email);
      if (res.success) setResult(res.data!);
      else setError(res.error);
    });
  }

  if (result) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setResult(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> {T.another}
        </button>
        <TrackingView data={result} mode="public" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-light text-brand">
          <PackageSearch className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy">{T.title}</h1>
        <p className="mt-2 text-text-secondary">{T.lead}</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">{T.orderNumber}</span>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={T.orderPlaceholder}
            autoComplete="off"
            className="h-12 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm uppercase placeholder:normal-case focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">{T.email}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={T.emailPlaceholder}
            autoComplete="email"
            className="h-12 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-[var(--radius-sm)] border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? T.searching : T.submit}
        </button>
        <p className="text-center text-xs text-text-secondary">{T.help}</p>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/dashboard/orders" className="font-medium text-brand hover:text-brand-hover">
          {T.loggedIn}
        </Link>
      </p>
    </div>
  );
}
