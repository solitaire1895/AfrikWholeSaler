"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MessageCircle, ShoppingCart, Check, Truck, X, Loader2 } from "lucide-react";
import type { Product } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/currency-context";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/i18n/client";
import { categoryName, deliveryText } from "@/i18n/names";

export function ProductCard({ product }: { product: Product }) {
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const { add, remove, lines } = useCart();
  const { t, format } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "added">("idle");
  const inCart = lines.some((l) => l.productId === product.id);
  const added = state === "added";

  // Adds the MOQ, or removes the product when it is already in the cart.
  // Clicks are ignored while saving and during the short "Added" confirmation.
  async function toggleCart() {
    if (state !== "idle") return;
    setState("busy");
    if (inCart) {
      await remove(product.id);
      setState("idle");
      return;
    }
    const res = await add(product, product.moq);
    if (!res.ok) return setState("idle");
    setState("added");
    setTimeout(() => setState("idle"), 1200);
  }
  const cartAria =
    inCart && !added
      ? format(t.catalog.card.removeAria, { name: product.name })
      : format(t.catalog.card.addAria, { n: product.moq, name: product.name });
  const lowestPrice = product.priceTiers[product.priceTiers.length - 1]?.price ?? 0;
  const startingPrice = product.priceTiers[0]?.price ?? 0;

  return (
    <Card hover className="group relative flex flex-col overflow-hidden cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-[var(--radius-card)] bg-surface-secondary">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.badges.slice(0, 2).map((badge) => (
              <Badge key={badge} badge={badge} />
            ))}
          </div>
          {/* Quick add to cart */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCart();
            }}
            className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${added ? "bg-success text-white" : inCart ? "bg-brand text-white hover:bg-brand-hover" : "bg-white/80 text-text-secondary hover:text-brand"}`}
            aria-label={cartAria}
            aria-pressed={inCart}
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-secondary">
              {categoryName(t, product.categorySlug, product.category)}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-xs font-semibold text-text-primary">
                {product.rating}
              </span>
              <span className="text-xs text-text-disabled">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-text-primary text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-brand transition-colors">
            {/* Stretched link: its ::after covers the whole card, so the card
                stays clickable without nesting the action links inside an <a>. */}
            <Link
              href={`/products/${product.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </Link>
          </h3>

          {/* Price */}
          <div className="mb-2">
            {startingPrice > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-text-primary">
                    {formatCurrencyPrice(startingPrice)}
                  </span>
                  <span className="text-xs text-text-secondary">{t.catalog.card.perUnit}</span>
                </div>
                {product.priceTiers.length > 1 && lowestPrice > 0 && lowestPrice < startingPrice && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {format(t.catalog.card.fromAt, {
                      price: formatCurrencyPrice(lowestPrice),
                      n: product.priceTiers[product.priceTiers.length - 1]?.minQuantity ?? 1,
                    })}
                  </p>
                )}
              </>
            ) : (
              <span className="text-base font-bold text-text-primary">{t.catalog.card.priceOnRequest}</span>
            )}
          </div>

          {/* MOQ & Shipping */}
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-3 mt-auto">
            <span className="flex items-center gap-1">
              {t.catalog.card.moq} <span className="font-semibold text-text-primary">{product.moq}</span>
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {deliveryText(t, product.deliveryEstimate)}
            </span>
          </div>

          {/* Actions */}
          <div className="relative z-10 flex gap-2">
            <button
              type="button"
              onClick={toggleCart}
              aria-label={cartAria}
              aria-pressed={inCart}
              className={`flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-button)] text-white text-xs font-semibold transition-colors ${added ? "bg-success" : inCart ? "bg-brand hover:bg-brand-hover" : "bg-navy hover:bg-navy-light"}`}
            >
              {state === "busy" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : added ? (
                <Check className="h-3 w-3" />
              ) : inCart ? (
                <X className="h-3 w-3" />
              ) : (
                <ShoppingCart className="h-3 w-3" />
              )}
              {added ? t.catalog.card.added : inCart ? t.catalog.card.remove : t.catalog.card.addToCart}
            </button>
            <Link
              href={`/products/${product.slug}?chat=1`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-border text-text-secondary hover:text-brand hover:border-brand/30 transition-colors"
              aria-label={t.catalog.card.chatAria}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
    </Card>
  );
}
