"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  Package,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  X,
  Check,
  Loader2,
  Smartphone,
  Clock,
  MapPin,
  Minus,
  Plus,
  Zap,
  Quote,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { ProductChat } from "@/components/products/product-chat";
import { AffiliateShareCard, AffiliateTracker } from "@/components/affiliate/affiliate-share-card";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import { useCart } from "@/lib/cart-context";
import { testimonials } from "@/lib/data";
import {
  basePrice,
  clampQuantity,
  isPriceOnRequest,
  nextTier,
  tierFor,
  unitPriceFor,
} from "@/lib/pricing";
import type { Product } from "@/types";
import { useI18n } from "@/i18n/client";
import { categoryName, countryName, deliveryText, subCategoryName } from "@/i18n/names";

// ========================================================
// Motion helpers
// ========================================================

/** Fades/lifts content in when it scrolls into view. */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Animates a product image from `from` to the navbar cart icon. */
function flyToCart(from: HTMLElement | null, src: string | undefined) {
  if (!from || !src || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(
    (el) => el.offsetParent !== null
  );
  if (!target) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, 140);
  const img = document.createElement("img");
  img.src = src;
  Object.assign(img.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "16px",
    zIndex: "100",
    pointerEvents: "none",
    boxShadow: "0 20px 40px -10px rgb(15 23 42 / 0.35)",
  });
  document.body.appendChild(img);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  img
    .animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, borderRadius: "16px" },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 80}px) scale(0.55)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4, borderRadius: "999px" },
      ],
      { duration: 700, easing: "cubic-bezier(0.55, 0, 0.25, 1)" }
    )
    .finished.finally(() => img.remove());
}

// ========================================================
// Gallery: cross-fading main image, hover zoom, thumbnails
// ========================================================

function Gallery({
  product,
  imageRef,
}: {
  product: Product;
  imageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t, format } = useI18n();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const images = product.images;
  const count = images.length;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      <div
        ref={imageRef}
        className="group relative aspect-square overflow-hidden rounded-[24px] bg-surface-secondary"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {count > 0 ? (
          images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                i === index ? "opacity-100" : "opacity-0"
              )}
              aria-hidden={i !== index}
            >
              <Image
                src={src}
                alt={i === index ? product.name : ""}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-300 ease-out",
                  zoom && i === index ? "scale-[1.8]" : "scale-100"
                )}
                style={zoom && i === index ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-text-disabled" />
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
          {product.badges.map((badge) => (
            <Badge key={badge} badge={badge} />
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label={t.product.previousImage}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 shadow-sm transition-all hover:bg-white group-hover:opacity-100 max-lg:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label={t.product.nextImage}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 shadow-sm transition-all hover:bg-white group-hover:opacity-100 max-lg:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        // Padding keeps the active thumbnail's ring from being clipped by the scroll container.
        <div className="mt-4 flex gap-3 overflow-x-auto p-1 pb-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={format(t.product.showImage, { n: i + 1 })}
              className={cn(
                "relative aspect-square w-[22%] min-w-20 shrink-0 overflow-hidden rounded-[16px] bg-surface-secondary ring-2 ring-offset-2 transition-all duration-300",
                i === index ? "ring-navy" : "ring-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {product.videoUrl && (
        <video
          src={product.videoUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-[16px] bg-navy object-cover"
        />
      )}
    </div>
  );
}

// ========================================================
// Page
// ========================================================

export function ProductDetail({
  product,
  relatedProducts,
  initialChatOpen = false,
  refCode,
}: {
  product: Product;
  relatedProducts: Product[];
  initialChatOpen?: boolean;
  /** Affiliate code from ?ref= — attributes this product to that affiliate. */
  refCode?: string;
}) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { t, format } = useI18n();
  const P = t.product;
  const catName = categoryName(t, product.categorySlug, product.category);
  const origin = countryName(t, product.originCountry);
  const delivery = deliveryText(t, product.deliveryEstimate);
  const unitsRange = (min: number, max: number | null) => `${min}${max ? `–${max}` : "+"}`;
  const cart = useCart();
  const [quantity, setQuantity] = useState(() => clampQuantity(product.moq, product.moq));
  const [qtyInput, setQtyInput] = useState(String(clampQuantity(product.moq, product.moq)));
  const [adding, setAdding] = useState<"idle" | "adding" | "added">("idle");
  const inCart = cart.lines.some((l) => l.productId === product.id);
  // Show "Remove" once the product is in the cart and the "Added" flash is over.
  const showRemove = inCart && adding === "idle";
  const [starting, setStarting] = useState(false);
  // Opens straight away when coming back from login (?chat=1).
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [toast, setToast] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  const onRequest = isPriceOnRequest(product.priceTiers);
  const unit = unitPriceFor(product.priceTiers, quantity);
  const base = basePrice(product.priceTiers);
  const saving = base > 0 && unit > 0 && unit < base ? Math.round((1 - unit / base) * 100) : 0;
  const upsell = nextTier(product.priceTiers, quantity);
  const activeTier = tierFor(product.priceTiers, quantity);
  const total = unit * quantity;
  const tiers = useMemo(
    () => [...product.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [product.priceTiers]
  );
  const step = product.moq >= 100 ? 10 : 1;

  // Sticky buy bar appears once the main buttons scroll out of view.
  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function changeQty(next: number) {
    const q = clampQuantity(next, product.moq);
    setQuantity(q);
    setQtyInput(String(q));
  }

  async function handleAdd(from?: HTMLElement | null) {
    if (adding !== "idle") return;
    if (inCart) {
      setAdding("adding");
      await cart.remove(product.id);
      setAdding("idle");
      setToast(format(P.toastRemoved, { name: product.name }));
      return;
    }
    setAdding("adding");
    flyToCart(from ?? imageRef.current, product.images[0]);
    const res = await cart.add(product, quantity);
    if (!res.ok) {
      setAdding("idle");
      setToast(res.error ?? P.couldNotAdd);
      return;
    }
    setAdding("added");
    setToast(format(P.toastAdded, { n: quantity, name: product.name }));
    setTimeout(() => setAdding("idle"), 1800);
  }

  async function handleStartOrder() {
    setStarting(true);
    const res = await cart.add(product, quantity);
    if (!res.ok) {
      setStarting(false);
      setToast(res.error ?? P.couldNotStart);
      return;
    }
    router.push("/checkout");
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast(P.toastLinkCopied);
      }
    } catch {
      // cancelled
    }
  }

  const faqs = [
    {
      id: "shipping",
      question: P.faqShippingQ,
      answer: format(P.faqShippingA, { days: delivery, country: origin }),
    },
    {
      id: "moq",
      question: P.faqMoqQ,
      answer: onRequest
        ? format(P.faqMoqOnRequest, { n: product.moq })
        : format(P.faqMoqTiers, {
            n: product.moq,
            tiers: tiers
              .filter((tier) => tier.price > 0)
              .map((tier) => format(P.faqTierItem, { range: unitsRange(tier.minQuantity, tier.maxQuantity), price: formatPrice(tier.price) }))
              .join(", "),
          }),
    },
    { id: "payment", question: P.faqPaymentQ, answer: P.faqPaymentA },
    { id: "quality", question: P.faqQualityQ, answer: P.faqQualityA },
    { id: "custom", question: P.faqCustomQ, answer: P.faqCustomA },
  ];

  const scrollRelated = (dir: number) =>
    relatedRef.current?.scrollBy({ left: dir * relatedRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 overflow-hidden py-5 text-xs text-text-secondary">
            <Link href="/" className="shrink-0 hover:text-brand">{P.breadcrumbHome}</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/products" className="shrink-0 hover:text-brand">{P.breadcrumbProducts}</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href={`/products?category=${product.categorySlug}`} className="shrink-0 hover:text-brand">
              {catName}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="truncate font-medium text-text-primary">{product.name}</span>
          </nav>

          {/* ===== Main ===== */}
          <div className="grid grid-cols-1 gap-8 pb-16 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <Gallery product={product} imageRef={imageRef} />
            </Reveal>

            <Reveal delay={120} className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">
                  {product.subCategory ? subCategoryName(t, product.subCategorySlug, product.subCategory) : catName} ·{" "}
                  {format(P.shipsFrom, { country: origin })}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-navy sm:text-4xl">
                  {product.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {product.reviewCount === 0 ? (
                    <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">{P.newProduct}</span>
                  ) : (
                  <>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.round(product.rating) ? "fill-gold text-gold" : "fill-border text-border"
                        )}
                      />
                    ))}
                  </span>
                  <span className="font-semibold text-text-primary">{product.rating.toFixed(1)}</span>
                  <a href="#reviews" className="text-text-secondary underline underline-offset-4 hover:text-brand">
                    {product.reviewCount === 1 ? P.reviewOne : format(P.reviewsCount, { n: product.reviewCount })}
                  </a>
                  </>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      product.stockStatus === "In Stock"
                        ? "bg-success/10 text-success"
                        : product.stockStatus === "Low Stock"
                          ? "bg-warning/10 text-warning"
                          : "bg-surface-secondary text-text-secondary"
                    )}
                  >
                    {t.catalog.stock[product.stockStatus] ?? product.stockStatus}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)]">
                {onRequest ? (
                  <div>
                    <p className="text-3xl font-bold text-navy">{P.priceOnRequest}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {P.priceOnRequestHint}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                      {saving > 0 && (
                        <span className="text-base text-text-disabled line-through">{formatPrice(base)}</span>
                      )}
                      {/* Re-keyed so the number fades in whenever the tier changes */}
                      <span
                        key={unit}
                        className="animate-[fade-in-up_0.35s_ease-out] text-4xl font-bold tracking-tight text-navy"
                      >
                        {formatPrice(unit)}
                      </span>
                      <span className="pb-1 text-sm text-text-secondary">{P.perUnit}</span>
                      {saving > 0 && (
                        <span
                          key={`save-${saving}`}
                          className="mb-1 animate-[scale-in_0.3s_ease-out] rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand"
                        >
                          {format(P.save, { n: saving })}
                        </span>
                      )}
                    </div>

                    {/* Tier chips (Alibaba-style) */}
                    {tiers.length > 1 && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {tiers.map((tier) => {
                          const active = activeTier === tier;
                          return (
                            <button
                              key={tier.minQuantity}
                              onClick={() => changeQty(tier.minQuantity)}
                              className={cn(
                                "rounded-[14px] border px-3 py-2 text-left transition-all duration-300",
                                active
                                  ? "border-navy bg-navy text-white shadow-md"
                                  : "border-border hover:border-navy/40"
                              )}
                            >
                              <span className={cn("block text-[11px]", active ? "text-white/70" : "text-text-secondary")}>
                                {format(P.tierUnits, { range: unitsRange(tier.minQuantity, tier.maxQuantity) })}
                              </span>
                              <span className="block text-sm font-bold">{tier.price ? formatPrice(tier.price) : P.onRequest}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Short description */}
              {product.description && (
                <div>
                  <p className={cn("text-[15px] leading-relaxed text-text-secondary", !descOpen && "line-clamp-3")}>
                    {product.description}
                  </p>
                  {product.description.length > 180 && (
                    <button
                      onClick={() => setDescOpen((o) => !o)}
                      className="mt-1 text-sm font-medium text-navy underline underline-offset-4 hover:text-brand"
                    >
                      {descOpen ? P.showLess : P.readMore}
                    </button>
                  )}
                </div>
              )}

              {/* Trust row */}
              <div className="grid grid-cols-3 gap-3 border-y border-border py-4 text-xs text-text-secondary">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 shrink-0 text-navy" />
                  {P.trustPayment}
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5 shrink-0 text-navy" />
                  {format(P.trustDelivery, { days: delivery })}
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-navy" />
                  {P.trustQuality}
                </span>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="qty" className="text-sm font-semibold text-navy">
                    {P.quantity}
                  </label>
                  <span className="text-xs text-text-secondary">
                    {product.moq === 1 ? P.minimumOrderOne : format(P.minimumOrder, { n: product.moq })}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex h-12 items-center rounded-full border border-border bg-surface">
                    <button
                      onClick={() => changeQty(quantity - step)}
                      disabled={quantity <= product.moq}
                      aria-label={P.decrease}
                      className="flex h-12 w-12 items-center justify-center rounded-full text-navy transition-colors hover:bg-surface-secondary disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      id="qty"
                      inputMode="numeric"
                      value={qtyInput}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setQtyInput(v);
                        if (v) setQuantity(clampQuantity(Number(v), product.moq));
                      }}
                      onBlur={() => changeQty(Number(qtyInput) || product.moq)}
                      className="w-20 bg-transparent text-center text-base font-semibold text-navy focus:outline-none"
                    />
                    <button
                      onClick={() => changeQty(quantity + step)}
                      aria-label={P.increase}
                      className="flex h-12 w-12 items-center justify-center rounded-full text-navy transition-colors hover:bg-surface-secondary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {!onRequest && unit > 0 && (
                    <div className="text-sm">
                      <span className="text-text-secondary">{P.total} </span>
                      <span key={total} className="inline-block animate-[fade-in_0.3s_ease-out] text-lg font-bold text-navy">
                        {formatPrice(total)}
                      </span>
                    </div>
                  )}
                </div>
                {upsell && (
                  <button
                    onClick={() => changeQty(upsell.minQuantity)}
                    className="mt-3 flex w-full animate-[fade-in_0.4s_ease-out] items-center gap-2 rounded-[14px] bg-gold-light px-4 py-2.5 text-left text-xs text-navy transition-colors hover:bg-gold/20"
                  >
                    <Zap className="h-4 w-4 shrink-0 text-gold" />
                    {format(P.upsell, { n: upsell.minQuantity - quantity, price: formatPrice(upsell.price) })}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div ref={actionsRef} className="space-y-3">
                <button
                  onClick={(e) => handleAdd(imageRef.current ?? e.currentTarget)}
                  disabled={adding === "adding"}
                  aria-pressed={inCart}
                  className={cn(
                    "relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-base font-semibold text-white transition-all duration-300 active:scale-[0.98]",
                    adding === "added" ? "bg-success" : showRemove ? "bg-brand hover:bg-brand-hover" : "bg-navy hover:bg-navy-light"
                  )}
                >
                  {adding === "adding" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : adding === "added" ? (
                    <span className="flex animate-[scale-in_0.3s_ease-out] items-center gap-2">
                      <Check className="h-5 w-5" /> {P.addedToCart}
                    </span>
                  ) : showRemove ? (
                    <>
                      <X className="h-5 w-5" /> {P.removeFromCart}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" /> {P.addToCart}
                    </>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleStartOrder}
                    disabled={starting}
                    className="flex h-14 items-center justify-center gap-2 rounded-full bg-brand text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
                  >
                    {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : P.startOrder}
                  </button>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="flex h-14 items-center justify-center gap-2 rounded-full border-2 border-navy text-base font-semibold text-navy transition-all hover:bg-navy hover:text-white active:scale-[0.98]"
                  >
                    <MessageCircle className="h-5 w-5" /> {P.chatNow}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-6 pt-1 text-sm text-text-secondary">
                  <button
                    onClick={() => setLiked((l) => !l)}
                    className="flex items-center gap-1.5 transition-colors hover:text-brand"
                    aria-pressed={liked}
                  >
                    <Heart
                      className={cn("h-4 w-4 transition-transform", liked && "scale-110 fill-brand text-brand")}
                    />
                    {liked ? P.savedItem : P.saveItem}
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-1.5 transition-colors hover:text-brand">
                    <Share2 className="h-4 w-4" /> {P.share}
                  </button>
                </div>
              </div>

              <AffiliateShareCard productSlug={product.slug} productName={product.name} unitPrice={unit} />
            </Reveal>
          </div>
        </div>

        {/* ===== Details & specs ===== */}
        <section className="bg-surface py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <Reveal className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-navy">{P.detailsTitle}</h2>
              {product.specs.length > 0 ? (
                <dl className="mt-6 divide-y divide-border overflow-hidden rounded-[20px] border border-border">
                  {product.specs.map((spec, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 px-5 py-3.5 text-sm odd:bg-background">
                      <dt className="text-text-secondary">{spec.label}</dt>
                      <dd className="font-medium text-text-primary">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 whitespace-pre-line leading-relaxed text-text-secondary">{product.description}</p>
              )}
            </Reveal>

            <Reveal delay={120} className="space-y-4">
              <h2 className="text-2xl font-bold text-navy">{P.shippingTitle}</h2>
              <div className="space-y-4 rounded-[20px] border border-border p-5">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{P.deliveryEstimate}</p>
                    <p className="text-sm text-text-secondary">{delivery}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{P.shipsFromLabel}</p>
                    <p className="text-sm text-text-secondary">{format(P.deliveredToDoor, { country: origin })}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Package className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{P.soldBy}</p>
                    <p className="text-sm text-text-secondary">{P.soldByText}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== Reviews ===== */}
        <section id="reviews" className="scroll-mt-20 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-navy">{P.reviewsTitle}</h2>
                <p className="mt-1 text-sm text-text-secondary">{P.reviewsLead}</p>
              </div>
              {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-navy">{product.rating.toFixed(1)}</span>
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-gold text-gold" : "fill-border text-border")}
                    />
                  ))}
                </span>
                <span className="text-sm text-text-secondary">({product.reviewCount})</span>
              </div>
              )}
            </Reveal>
            <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
              {testimonials.map((item, i) => (
                <Reveal key={item.id} delay={i * 90} className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
                  <figure className="h-full rounded-[20px] bg-surface p-5 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-semibold text-brand">
                        {item.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-secondary">{countryName(t, item.country)}</p>
                      </div>
                      <span className="ml-auto flex">
                        {Array.from({ length: item.rating }).map((_, k) => (
                          <Star key={k} className="h-3.5 w-3.5 fill-gold text-gold" />
                        ))}
                      </span>
                    </div>
                    <blockquote className="mt-4 text-sm leading-relaxed text-text-secondary">
                      <Quote className="mb-1 h-4 w-4 text-brand/30" />
                      {(t.content.testimonials as Record<string, string>)[item.id] ?? item.quote}
                    </blockquote>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-navy">{P.faqTitle}</h2>
              <Accordion items={faqs} className="mt-6" />
            </Reveal>
          </div>
        </section>

        {/* ===== Related ===== */}
        {relatedProducts.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Reveal className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-navy">{P.relatedTitle}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollRelated(-1)}
                    aria-label={P.scrollLeft}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-navy shadow-[var(--shadow-card)] transition-colors hover:bg-navy hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => scrollRelated(1)}
                    aria-label={P.scrollRight}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-navy shadow-[var(--shadow-card)] transition-colors hover:bg-navy hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </Reveal>
              <div ref={relatedRef} className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4">
                {relatedProducts.map((rp, i) => {
                  const rpPrice = unitPriceFor(rp.priceTiers, rp.moq);
                  return (
                    <Reveal key={rp.id} delay={i * 80} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
                      <Link href={`/products/${rp.slug}`} className="group block">
                        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-surface-secondary">
                          {rp.images[0] ? (
                            <Image
                              src={rp.images[0]}
                              alt={rp.name}
                              fill
                              sizes="(max-width: 640px) 46vw, 23vw"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <Package className="m-auto h-10 w-10 text-text-disabled" />
                          )}
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm font-medium text-text-primary transition-colors group-hover:text-brand">
                          {rp.name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-navy">
                          {rpPrice ? formatPrice(rpPrice) : P.priceOnRequest}
                          <span className="ml-1 text-xs font-normal text-text-secondary">MOQ {rp.moq}</span>
                        </p>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* ===== Sticky buy bar ===== */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:bottom-4 sm:left-4 sm:right-auto sm:p-0",
          showSticky ? "translate-y-0" : "translate-y-[130%]"
        )}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3 rounded-[20px] border border-border bg-surface/95 p-2.5 shadow-[var(--shadow-modal)] backdrop-blur-md sm:max-w-md">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-surface-secondary">
            {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
            <p className="text-sm font-bold text-navy">
              {unit ? format(P.stickyPrice, { price: formatPrice(unit), n: quantity }) : format(P.stickyOnRequest, { n: quantity })}
            </p>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            aria-label={P.chatNow}
            tabIndex={showSticky ? 0 : -1}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-navy hover:bg-surface-secondary"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => handleAdd(e.currentTarget)}
            tabIndex={showSticky ? 0 : -1}
            aria-pressed={inCart}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-colors",
              adding === "added" ? "bg-success" : showRemove ? "bg-brand hover:bg-brand-hover" : "bg-navy hover:bg-navy-light"
            )}
          >
            {adding === "added" ? <Check className="h-4 w-4" /> : showRemove ? <X className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {adding === "added" ? P.added : showRemove ? P.remove : P.addToCart}
          </button>
        </div>
      </div>

      {/* ===== Toast ===== */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "fixed left-1/2 top-20 z-[80] -translate-x-1/2 transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        )}
      >
        {toast && (
          <div className="flex items-center gap-3 rounded-full bg-navy py-2 pl-4 pr-2 text-sm text-white shadow-[var(--shadow-modal)]">
            <Check className="h-4 w-4 text-gold" />
            <span className="max-w-[60vw] truncate">{toast}</span>
            <Link href="/cart" className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">
              {P.viewCart}
            </Link>
          </div>
        )}
      </div>

      <AffiliateTracker code={refCode} productId={product.id} />
      <ProductChat product={product} quantity={quantity} open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

export function ProductNotFound() {
  const { t } = useI18n();
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-navy">{t.product.notFoundTitle}</h1>
          <p className="mb-4 text-text-secondary">{t.product.notFoundText}</p>
          <ButtonLink href="/products" variant="primary" size="md">
            {t.product.browseAll}
          </ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
