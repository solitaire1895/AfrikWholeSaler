import { cn } from "@/lib/utils";
import type { ProductBadge } from "@/types";

const badgeStyles: Record<ProductBadge, string> = {
  New: "bg-info/10 text-info border-info/20",
  Featured: "bg-gold/15 text-gold border-gold/30",
  "Best Seller": "bg-brand/10 text-brand border-brand/20",
  "Limited Stock": "bg-warning/10 text-warning border-warning/20",
  Wholesale: "bg-success/10 text-success border-success/20",
  "Fast Shipping": "bg-info/10 text-info border-info/20",
  "AI Recommended": "bg-navy/10 text-navy border-navy/20",
  Premium: "bg-gold/15 text-gold border-gold/30",
};

interface BadgeProps {
  badge: ProductBadge;
  className?: string;
}

export function Badge({ badge, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        badgeStyles[badge],
        className
      )}
    >
      {badge}
    </span>
  );
}