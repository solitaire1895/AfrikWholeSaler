"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, ArrowRight, Info, ShieldCheck, Smartphone } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/lib/currency-context";
import { basePrice, nextTier, unitPriceFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { categoryName } from "@/i18n/names";

export function CartView() {
  const router = useRouter();
  const { lines, ready, subtotal, hasPriceOnRequest, loggedIn, setQuantity, remove } = useCart();
  const { formatPrice } = useCurrency();
  const { t, format } = useI18n();
  const C = t.shop.cart;

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md animate-[fade-in-up_0.5s_ease-out] flex-col items-center justify-center px-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-brand">
          <ShoppingCart className="h-9 w-9" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-navy">{C.emptyTitle}</h1>
        <p className="mt-2 text-text-secondary">{C.emptyText}</p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-light"
        >
          {C.browse} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Always /checkout: the page sends logged-out visitors to login and back.
  const checkoutHref = "/checkout";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-navy">{C.title}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {lines.length === 1 ? C.countLineOne : format(C.countLine, { n: lines.length })}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {lines.map((line, i) => {
            const p = line.product;
            const unit = unitPriceFor(p.priceTiers, line.quantity);
            const base = basePrice(p.priceTiers);
            const upsell = nextTier(p.priceTiers, line.quantity);
            const step = p.moq >= 100 ? 10 : 1;
            return (
              <li
                key={line.productId}
                style={{ animationDelay: `${i * 60}ms` }}
                className="flex animate-[fade-in-up_0.5s_ease-out_both] gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]"
              >
                <Link
                  href={`/products/${p.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[14px] bg-surface-secondary sm:h-28 sm:w-28"
                >
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill sizes="112px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${p.slug}`} className="line-clamp-2 font-medium text-text-primary hover:text-brand">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {categoryName(t, p.categorySlug, p.category)} · {t.common.moq} {p.moq}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(line.productId)}
                      aria-label={format(C.remove, { name: p.name })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-disabled transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                    <div className="flex h-10 items-center rounded-full border border-border">
                      <button
                        onClick={() => setQuantity(line.productId, line.quantity - step)}
                        disabled={line.quantity <= p.moq}
                        aria-label={C.decrease}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-navy hover:bg-surface-secondary disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-14 text-center text-sm font-semibold text-navy">{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(line.productId, line.quantity + step)}
                        aria-label={C.increase}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-navy hover:bg-surface-secondary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      {unit ? (
                        <>
                          <p key={unit * line.quantity} className="animate-[fade-in_0.3s_ease-out] text-lg font-bold text-navy">
                            {formatPrice(unit * line.quantity)}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {format(C.perUnit, { price: formatPrice(unit) })}
                            {base > unit && <span className="ml-1 text-success">(−{Math.round((1 - unit / base) * 100)}%)</span>}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-navy">{C.priceOnRequest}</p>
                      )}
                    </div>
                  </div>
                  {upsell && (
                    <button
                      onClick={() => setQuantity(line.productId, upsell.minQuantity)}
                      className="mt-3 self-start rounded-full bg-gold-light px-3 py-1 text-xs text-navy hover:bg-gold/20"
                    >
                      {format(C.upsell, { n: upsell.minQuantity - line.quantity, price: formatPrice(upsell.price) })}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="h-fit animate-[fade-in-up_0.6s_ease-out] rounded-[20px] bg-surface p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-navy">{C.summary}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">{C.products}</dt>
              <dd className="font-medium text-text-primary">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">{C.shippingCustoms}</dt>
              <dd className="text-text-secondary">{C.confirmedAfter}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold text-navy">{C.subtotal}</span>
            <span key={subtotal} className="animate-[fade-in_0.3s_ease-out] text-2xl font-bold text-navy">
              {formatPrice(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-disabled">{t.layout.currency.note}</p>

          {hasPriceOnRequest && (
            <p className="mt-4 flex gap-2 rounded-[14px] bg-gold-light p-3 text-xs text-navy">
              <Info className="h-4 w-4 shrink-0 text-gold" />
              {C.onRequestNote}
            </p>
          )}

          <button
            onClick={() => router.push(checkoutHref)}
            className={cn(
              "mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-brand-hover active:scale-[0.98]"
            )}
          >
            {loggedIn ? C.checkout : C.loginToCheckout} <ArrowRight className="h-5 w-5" />
          </button>
          <Link href="/products" className="mt-3 block text-center text-sm text-text-secondary hover:text-brand">
            {C.continue}
          </Link>

          <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-text-secondary">
            <p className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-navy" /> {C.payWith}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-navy" /> {C.inspected}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
