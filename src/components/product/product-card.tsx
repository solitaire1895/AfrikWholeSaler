import Image from "next/image";
import Link from "next/link";
import { Star, Heart, MessageCircle, FileText, Truck } from "lucide-react";
import type { Product } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const lowestPrice = product.priceTiers[product.priceTiers.length - 1]?.price ?? 0;
  const startingPrice = product.priceTiers[0]?.price ?? 0;

  return (
    <Card hover className="group flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-[var(--radius-card)] bg-surface-secondary">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badges.slice(0, 2).map((badge) => (
            <Badge key={badge} badge={badge} />
          ))}
        </div>
        {/* Favorite */}
        <button
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-text-secondary hover:text-brand transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">
            {product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="text-xs font-semibold text-text-primary">
              {product.rating}
            </span>
            <span className="text-xs text-text-disabled">
              ({product.reviewCount})
            </span>
          </div>
        </div>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-text-primary text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brand transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-text-primary">
              {formatPrice(startingPrice)}
            </span>
            <span className="text-xs text-text-secondary">/ unit</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            From{" "}
            <span className="font-semibold text-success">
              {formatPrice(lowestPrice)}
            </span>{" "}
            at {product.priceTiers[product.priceTiers.length - 1]?.minQuantity}+ units
          </p>
        </div>

        {/* MOQ & Shipping */}
        <div className="flex items-center gap-3 text-xs text-text-secondary mb-4 mt-auto">
          <span className="flex items-center gap-1">
            MOQ: <span className="font-semibold text-text-primary">{product.moq}</span>
          </span>
          <span className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            {product.deliveryEstimate}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/quote?product=${product.slug}`}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Quote
          </Link>
          <Link
            href="/chat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border border-border text-text-secondary hover:text-brand hover:border-brand/30 transition-colors"
            aria-label="Chat about this product"
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}