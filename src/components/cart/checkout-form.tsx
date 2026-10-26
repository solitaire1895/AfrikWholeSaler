"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ArrowLeft, Info, Smartphone, Coins } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { placeOrder } from "@/app/actions/cart";
import { unitPriceFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { DEPOSIT_THRESHOLD_USD } from "@/lib/deposit";

const COUNTRIES = [
  "Cameroon", "Senegal", "Côte d'Ivoire", "Benin", "Togo", "Burkina Faso", "Mali", "Niger",
  "Guinea", "Gabon", "Congo", "DR Congo", "Chad", "Central African Republic", "Nigeria",
  "Ghana", "Kenya", "Tanzania", "Uganda", "Rwanda", "Other",
];

const inputClass =
  "h-12 w-full rounded-[14px] border border-border bg-surface px-4 text-sm text-text-primary transition-colors placeholder:text-text-disabled focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10";

export function CheckoutForm({
  defaults,
  walletBalance = 0,
}: {
  defaults: { fullName: string; phone: string; country: string; city: string };
  /** Affiliate earnings available to spend (USD). */
  walletBalance?: number;
}) {
  const router = useRouter();
  const { lines, ready, subtotal, hasPriceOnRequest, refresh } = useCart();
  const { formatPrice } = useCurrency();
  const { t, format } = useI18n();
  const K = t.shop.checkout;
  const countryLabel = (c: string) => (t.shop.countries as Record<string, string>)[c] ?? c;
  const [form, setForm] = useState({ ...defaults, address: "", notes: "" });
  const [useWallet, setUseWallet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await placeOrder({ ...form, useWallet: useWallet && walletApplied > 0 });
    if (!res.success) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    await refresh();
    router.push(
      `/dashboard/orders?placed=${encodeURIComponent(res.data!.orderNumber)}${res.data!.paid ? "&wallet=1" : ""}`
    );
  }

  // The wallet can only pay for priced orders (price-on-request totals aren't known yet).
  const walletApplied = useWallet && !hasPriceOnRequest ? Math.min(walletBalance, subtotal) : 0;
  const due = Math.max(0, subtotal - walletApplied);

  if (ready && lines.length === 0 && !submitting) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-navy">{K.nothingTitle}</h1>
        <p className="mt-2 text-text-secondary">{K.nothingText}</p>
        <Link href="/products" className="mt-6 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">
          {K.browse}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> {K.back}
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">{K.title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Delivery details */}
        <section className="animate-[fade-in-up_0.5s_ease-out] space-y-5 rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] lg:col-span-3">
          <h2 className="text-lg font-semibold text-navy">{K.delivery}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.fullName}</span>
              <input required value={form.fullName} onChange={set("fullName")} className={inputClass} autoComplete="name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.phone}</span>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+237 6XX XXX XXX"
                className={inputClass}
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.country}</span>
              <select required value={form.country} onChange={set("country")} className={cn(inputClass, "cursor-pointer")}>
                <option value="" disabled>
                  {K.select}
                </option>
                {COUNTRIES.includes(form.country) || !form.country ? null : <option>{form.country}</option>}
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {countryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.city}</span>
              <input required value={form.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.address}</span>
              <input
                required
                value={form.address}
                onChange={set("address")}
                placeholder={K.addressPlaceholder}
                className={inputClass}
                autoComplete="street-address"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-text-secondary">{K.notes}</span>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder={K.notesPlaceholder}
                className={cn(inputClass, "h-auto py-3")}
              />
            </label>
          </div>
        </section>

        {/* Review */}
        <aside className="h-fit animate-[fade-in-up_0.6s_ease-out] rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:col-span-2">
          <h2 className="text-lg font-semibold text-navy">{K.yourOrder}</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => {
              const unit = unitPriceFor(line.product.priceTiers, line.quantity);
              return (
                <li key={line.productId} className="flex items-center gap-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-secondary">
                    {line.product.images[0] && (
                      <Image src={line.product.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    )}
                    <span className="absolute -right-1 -top-1 rounded-full bg-navy px-1.5 text-[10px] font-bold text-white">
                      {line.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{line.product.name}</span>
                  <span className="shrink-0 text-sm font-medium text-navy">
                    {unit ? formatPrice(unit * line.quantity) : K.onRequest}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{K.products}</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{K.shippingCustoms}</span>
              <span className="text-text-secondary">{K.confirmedBySeller}</span>
            </div>
          </div>
          {walletBalance > 0.009 && (
            <label
              className={cn(
                "mt-4 flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 transition-colors",
                useWallet ? "border-gold bg-gold-light" : "border-border hover:border-gold/50",
                hasPriceOnRequest && "cursor-not-allowed opacity-60"
              )}
            >
              <input
                type="checkbox"
                checked={useWallet}
                disabled={hasPriceOnRequest}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-navy)]"
              />
              <Coins className="h-5 w-5 shrink-0 text-gold" />
              <span className="flex-1 text-sm">
                <span className="block font-medium text-navy">{K.useBalance}</span>
                <span className="block text-xs text-text-secondary">
                  {hasPriceOnRequest ? K.balanceLater : format(K.balanceAvailable, { amount: formatPrice(walletBalance) })}
                </span>
              </span>
            </label>
          )}

          {walletApplied > 0 && (
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-text-secondary">{K.affiliateBalance}</span>
              <span className="font-medium text-success">−{formatPrice(walletApplied)}</span>
            </div>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold text-navy">{walletApplied > 0 ? K.toPay : K.total}</span>
            <span key={due} className="animate-[fade-in_0.3s_ease-out] text-2xl font-bold text-navy">
              {formatPrice(due)}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-disabled">{t.layout.currency.note}</p>

          {hasPriceOnRequest && (
            <p className="mt-4 flex gap-2 rounded-[14px] bg-gold-light p-3 text-xs text-navy">
              <Info className="h-4 w-4 shrink-0 text-gold" />
              {K.onRequestNote}
            </p>
          )}
          {!hasPriceOnRequest && subtotal >= DEPOSIT_THRESHOLD_USD && (
            <p className="mt-4 flex gap-2 rounded-[14px] bg-brand-light p-3 text-xs text-navy">
              <Info className="h-4 w-4 shrink-0 text-brand" />
              {t.account.orders.depositHint}
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 animate-[fade-in_0.3s_ease-out] rounded-[14px] bg-error/10 p-3 text-sm text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !ready}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {submitting
              ? K.placing
              : walletApplied > 0 && due <= 0.005
                ? K.placeWithBalance
                : K.place}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-text-secondary">
            <Smartphone className="h-3.5 w-3.5" />
            {K.nextStep}
          </p>
        </aside>
      </div>
    </form>
  );
}
