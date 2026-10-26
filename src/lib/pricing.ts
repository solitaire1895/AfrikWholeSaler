import type { PriceTier } from "@/types";

// Tiered (Alibaba-style) pricing, shared by the product page, the cart and
// the server when it prices an order — so all three always agree.

function sortedTiers(tiers: PriceTier[]) {
  return [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
}

/** The tier that applies to a quantity (the highest tier whose minimum is reached). */
export function tierFor(tiers: PriceTier[], quantity: number): PriceTier | undefined {
  const sorted = sortedTiers(tiers);
  let match = sorted[0];
  for (const t of sorted) if (quantity >= t.minQuantity) match = t;
  return match;
}

/** Unit price for a quantity; 0 means "price on request". */
export function unitPriceFor(tiers: PriceTier[], quantity: number): number {
  return Number(tierFor(tiers, quantity)?.price ?? 0);
}

/** The next cheaper tier above the current quantity, to nudge "buy N more to save". */
export function nextTier(tiers: PriceTier[], quantity: number): PriceTier | undefined {
  const current = unitPriceFor(tiers, quantity);
  return sortedTiers(tiers).find((t) => t.minQuantity > quantity && t.price > 0 && t.price < current);
}

/** Base (first tier) price, used to show the saving of bigger tiers. */
export function basePrice(tiers: PriceTier[]): number {
  return Number(sortedTiers(tiers)[0]?.price ?? 0);
}

export function isPriceOnRequest(tiers: PriceTier[]): boolean {
  return tiers.length === 0 || tiers.every((t) => !t.price);
}

/** Clamp a requested quantity to at least the MOQ and a sane maximum. */
export function clampQuantity(quantity: number, moq: number): number {
  const q = Math.floor(Number.isFinite(quantity) ? quantity : moq);
  return Math.min(1_000_000, Math.max(Math.max(1, moq), q));
}
