"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addToCart as addToCartAction,
  getCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
  type CartLine,
} from "@/app/actions/cart";
import { clampQuantity, unitPriceFor } from "@/lib/pricing";
import type { Product } from "@/types";

// ========================================================
// Cart state for the whole site.
// Logged-in users: stored in Supabase (cart_items).
// Guests: stored in this browser, merged into the account on login.
// ========================================================

const GUEST_KEY = "aw-guest-cart-v1";

interface CartContextValue {
  lines: CartLine[];
  count: number; // number of distinct products
  subtotal: number; // USD, priced lines only
  hasPriceOnRequest: boolean;
  loggedIn: boolean;
  ready: boolean;
  /** Bumps whenever something is added — drives the navbar badge animation. */
  addedTick: number;
  add: (product: Product, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readGuest(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeGuest(lines: CartLine[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
  } catch {
    // storage blocked — cart lives in memory for this visit
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [addedTick, setAddedTick] = useState(0);
  const loggedInRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loggedInRef.current) setLines(await getCart());
    else setLines(readGuest());
  }, []);

  // Track auth; on login, move the guest cart into the account.
  useEffect(() => {
    const supabase = createClient();

    const apply = async (isIn: boolean) => {
      loggedInRef.current = isIn;
      setLoggedIn(isIn);
      if (isIn) {
        const guest = readGuest();
        if (guest.length) {
          await mergeGuestCart(guest.map((l) => ({ productId: l.productId, quantity: l.quantity })));
          writeGuest([]);
        }
        setLines(await getCart());
      } else {
        setLines(readGuest());
      }
      setReady(true);
    };

    supabase.auth.getUser().then(({ data: { user } }) => apply(!!user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") apply(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const add = useCallback(async (product: Product, quantity: number) => {
    const qty = clampQuantity(quantity, product.moq);

    if (!loggedInRef.current) {
      const current = readGuest();
      const existing = current.find((l) => l.productId === product.id);
      const next = existing
        ? current.map((l) => (l.productId === product.id ? { ...l, quantity: clampQuantity(l.quantity + qty, product.moq), product } : l))
        : [...current, { productId: product.id, quantity: qty, product }];
      writeGuest(next);
      setLines(next);
      setAddedTick((t) => t + 1);
      return { ok: true };
    }

    // Optimistic: show it in the cart right away, then confirm with the server.
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      return existing
        ? prev.map((l) => (l.productId === product.id ? { ...l, quantity: clampQuantity(l.quantity + qty, product.moq) } : l))
        : [...prev, { productId: product.id, quantity: qty, product }];
    });
    setAddedTick((t) => t + 1);

    const res = await addToCartAction(product.id, qty);
    if (!res.success) {
      setLines(await getCart());
      return { ok: false, error: res.error };
    }
    return { ok: true };
  }, []);

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: clampQuantity(quantity, l.product.moq) } : l))
    );
    if (!loggedInRef.current) {
      writeGuest(
        readGuest().map((l) => (l.productId === productId ? { ...l, quantity: clampQuantity(quantity, l.product.moq) } : l))
      );
      return;
    }
    const res = await updateCartItem(productId, quantity);
    if (!res.success) setLines(await getCart());
  }, []);

  const remove = useCallback(async (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
    if (!loggedInRef.current) {
      writeGuest(readGuest().filter((l) => l.productId !== productId));
      return;
    }
    const res = await removeCartItem(productId);
    if (!res.success) setLines(await getCart());
  }, []);

  const value = useMemo<CartContextValue>(() => {
    let subtotal = 0;
    let hasPriceOnRequest = false;
    for (const l of lines) {
      const unit = unitPriceFor(l.product.priceTiers, l.quantity);
      if (!unit) hasPriceOnRequest = true;
      subtotal += unit * l.quantity;
    }
    return {
      lines,
      count: lines.length,
      subtotal,
      hasPriceOnRequest,
      loggedIn,
      ready,
      addedTick,
      add,
      setQuantity,
      remove,
      refresh,
    };
  }, [lines, loggedIn, ready, addedTick, add, setQuantity, remove, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
