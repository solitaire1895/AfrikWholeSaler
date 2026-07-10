"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  Package,
  FileText,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Calculator,
  Info,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { products } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import type { PriceTier } from "@/types";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const product = products.find((p) => p.slug === slug);

  const [quantity, setQuantity] = useState(product?.moq ?? 100);
  const [destination, setDestination] = useState("Senegal");

  const destinations = [
    "Senegal",
    "Nigeria",
    "Cameroon",
    "Kenya",
    "Ghana",
    "Ivory Coast",
    "Tanzania",
    "Uganda",
  ];

  // Calculate applicable price tier
  const applicableTier = useMemo<PriceTier | undefined>(() => {
    if (!product) return undefined;
    return [...product.priceTiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((tier) => quantity >= tier.minQuantity);
  }, [quantity, product]);

  const unitPrice = applicableTier?.price ?? product?.priceTiers[0]?.price ?? 0;
  const totalPrice = unitPrice * quantity;
  const shippingCost = (product?.shippingEstimate ?? 0) * quantity;
  const importTax = (product?.importTaxEstimate ?? 0) * quantity;
  const landedCost = totalPrice + shippingCost + importTax;
  const landedCostPerUnit = landedCost / quantity;

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-2">
              Product not found
            </h1>
            <p className="text-text-secondary mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <ButtonLink href="/products" variant="primary" size="md">
              Browse all products
            </ButtonLink>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const relatedProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/products" className="hover:text-brand">
                Products
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href={`/products?category=${product.categorySlug}`}
                className="hover:text-brand"
              >
                {product.category}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-primary font-medium truncate">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Product Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-secondary">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {product.badges.map((badge) => (
                    <Badge key={badge} badge={badge} />
                  ))}
                </div>
              </div>
              {/* Thumbnail strip (placeholder for multiple images) */}
              <div className="flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-sm)] border-2 border-brand bg-surface-secondary">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-surface-secondary text-text-disabled text-xs">
                  + More
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-text-secondary">
                    {product.category}
                  </span>
                  <span className="text-text-disabled">·</span>
                  <span className="text-sm text-text-secondary">
                    Origin: {product.originCountry}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-navy tracking-tight mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(product.rating)
                            ? "fill-gold text-gold"
                            : "fill-surface-secondary text-border"
                        )}
                      />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-text-primary">
                      {product.rating}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {product.reviewCount} reviews
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-text-secondary leading-relaxed">
                {product.description}
              </p>

              {/* Price Tiers Table */}
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-surface-secondary">
                  <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-brand" />
                    Bulk Pricing Tiers
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {product.priceTiers.map((tier, idx) => {
                    const isActive =
                      quantity >= tier.minQuantity &&
                      (!tier.maxQuantity || quantity <= tier.maxQuantity);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between px-5 py-3 transition-colors",
                          isActive && "bg-brand-light"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isActive && (
                            <CheckCircle className="h-4 w-4 text-brand" />
                          )}
                          <span className="text-sm font-medium text-text-primary">
                            {tier.minQuantity}
                            {tier.maxQuantity
                              ? ` – ${tier.maxQuantity}`
                              : "+"}{" "}
                            units
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-navy">
                            {formatPrice(tier.price, tier.currency)}
                          </span>
                          <span className="text-xs text-text-secondary ml-1">
                            /unit
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Cost Calculator */}
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 space-y-4">
                <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-brand" />
                  Cost Calculator
                </h3>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Quantity (MOQ: {product.moq})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQuantity(Math.max(product.moq, quantity - 100))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-secondary hover:bg-surface-secondary"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      min={product.moq}
                      onChange={(e) =>
                        setQuantity(Math.max(product.moq, Number(e.target.value)))
                      }
                      className="flex-1 h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-center font-medium text-text-primary focus:border-brand focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 100)}
                      className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-secondary hover:bg-surface-secondary"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Destination Country
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
                  >
                    {destinations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      Unit Price ({applicableTier?.minQuantity}+ tier)
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatPrice(unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Product Total</span>
                    <span className="font-medium text-text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      Shipping (est.)
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      Import Tax (est.)
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatPrice(importTax)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold text-navy">
                      Landed Cost Total
                    </span>
                    <span className="font-bold text-brand text-lg">
                      {formatPrice(landedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-disabled">Per unit (landed)</span>
                    <span className="text-text-secondary font-medium">
                      {formatPrice(landedCostPerUnit)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] bg-gold-light border border-gold/20">
                  <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    Estimates only. Actual shipping and import duties confirmed
                    at quote stage. We handle all customs documentation.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <ButtonLink
                  href={`/quote?product=${product.slug}`}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  <FileText className="h-5 w-5" />
                  Request a Quote
                </ButtonLink>
                <ButtonLink
                  href="/dashboard/messages"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat with an Expert
                </ButtonLink>
                <button className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-button)] border border-border text-text-secondary hover:text-brand hover:border-brand/30 transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-button)] border border-border text-text-secondary hover:text-brand hover:border-brand/30 transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust Block — Sold by AfrikWholesaler */}
          <div className="mt-12 rounded-[var(--radius-lg)] gradient-dark text-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10">
                  <ShieldCheck className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    Quality Inspected
                  </h3>
                  <p className="text-white/60 text-sm">
                    Every unit checked against specs before shipping. QC report
                    with photos provided.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10">
                  <Truck className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    End-to-End Logistics
                  </h3>
                  <p className="text-white/60 text-sm">
                    Sourcing, QC, shipping, customs clearance, and delivery —
                    all handled by us.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10">
                  <Package className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    Sold by AfrikWholesaler
                  </h3>
                  <p className="text-white/60 text-sm">
                    You buy from us, not factories. Single point of contact,
                    single invoice, full accountability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Specs & Details */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Specifications */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-navy mb-4">
                Specifications
              </h2>
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
                <div className="divide-y divide-border">
                  {product.specs.map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <span className="text-sm text-text-secondary">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-navy">Shipping Info</h2>
              <Card className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Delivery Estimate
                    </p>
                    <p className="text-sm text-text-secondary">
                      {product.deliveryEstimate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Shipping (per unit)
                    </p>
                    <p className="text-sm text-text-secondary">
                      ~{formatPrice(product.shippingEstimate)} estimated
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Import Tax (per unit)
                    </p>
                    <p className="text-sm text-text-secondary">
                      ~{formatPrice(product.importTaxEstimate)} estimated
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Stock Status
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        product.stockStatus === "In Stock"
                          ? "text-success"
                          : product.stockStatus === "Low Stock"
                            ? "text-warning"
                            : "text-text-secondary"
                      )}
                    >
                      {product.stockStatus}
                    </p>
                  </div>
                </div>
              </Card>

              {/* AI Recommendation Badge */}
              {product.badges.includes("AI Recommended") && (
                <div className="rounded-[var(--radius-lg)] border border-navy/20 bg-navy/5 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-navy" />
                    <h3 className="text-sm font-semibold text-navy">
                      AI Recommended
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Our AI sourcing assistant identified this product as a
                    high-value option based on quality, price, and demand
                    patterns across African markets.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold text-navy mb-6">
                Related Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedProducts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="group"
                  >
                    <Card hover className="overflow-hidden">
                      <div className="relative aspect-square overflow-hidden bg-surface-secondary">
                        <Image
                          src={rp.images[0]}
                          alt={rp.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-text-secondary mb-1">
                          {rp.category}
                        </p>
                        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-brand transition-colors">
                          {rp.name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-navy">
                          {formatPrice(rp.priceTiers[0]?.price ?? 0)}
                          <span className="text-xs font-normal text-text-secondary ml-1">
                            /unit
                          </span>
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}