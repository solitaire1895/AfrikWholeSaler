"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

/** Navbar cart icon. `data-cart-target` is where "fly to cart" animations land. */
export function CartButton() {
  const { count, addedTick } = useCart();
  const { t, format } = useI18n();
  const [bumpKey, setBumpKey] = useState(0);

  // Restart the bump animation each time something is added.
  useEffect(() => {
    if (addedTick === 0) return;
    const t = setTimeout(() => setBumpKey(addedTick), 650); // after the flying image lands
    return () => clearTimeout(t);
  }, [addedTick]);

  return (
    <Link
      href="/cart"
      data-cart-target
      aria-label={count === 1 ? t.layout.nav.cartItem : format(t.layout.nav.cartItems, { n: count })}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface-secondary hover:text-brand"
    >
      <ShoppingCart key={`icon-${bumpKey}`} className={cn("h-5 w-5", bumpKey > 0 && "animate-[cart-bump_500ms_ease-out]")} />
      {count > 0 && (
        <span
          key={`badge-${bumpKey}`}
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-white",
            bumpKey > 0 && "animate-[cart-pop_500ms_cubic-bezier(0.34,1.56,0.64,1)]"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
