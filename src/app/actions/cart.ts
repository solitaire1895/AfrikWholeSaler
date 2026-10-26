"use server";

import { rateLimit } from "@/lib/rate-limit";
import { te } from "@/i18n/errors";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendOrderPlacedEmail } from "@/lib/email";
import { getLocale } from "@/i18n/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCustomer, mapProduct, type ProductRow } from "@/lib/queries";
import { clampQuantity, unitPriceFor } from "@/lib/pricing";
import { sendMessage } from "@/app/actions/crud";
import type { Product } from "@/types";
import { AFFILIATE_COOKIE, parseAttribution } from "@/lib/affiliate";

// ========================================================
// Cart, checkout and product chat — Alibaba-style buying
// ========================================================

export interface CartLine {
  productId: string;
  quantity: number;
  product: Product;
}

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const PRODUCT_COLUMNS = "*";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Current user's cart, with live product data. Empty for guests. */
export async function getCart(): Promise<CartLine[]> {
  const { supabase, user } = await requireUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(`product_id, quantity, products(${PRODUCT_COLUMNS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data
    .filter((row) => row.products && (row.products as unknown as ProductRow).is_active)
    .map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
      product: mapProduct(row.products as unknown as ProductRow),
    }));
}

async function getProductRow(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", productId).maybeSingle();
  return data as ProductRow | null;
}

/** Adds `quantity` to the cart line (creating it at MOQ or more). */
export async function addToCart(productId: string, quantity: number): Promise<Result<{ quantity: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Please log in to use the cart.") };

  const product = await getProductRow(productId);
  if (!product || !product.is_active) return { success: false, error: await te("This product is no longer available.") };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  const next = clampQuantity((existing?.quantity ?? 0) + quantity, product.moq);

  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { user_id: user.id, product_id: productId, quantity: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,product_id" }
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/cart");
  return { success: true, data: { quantity: next } };
}

/** Sets a cart line's quantity (never below the MOQ). */
export async function updateCartItem(productId: string, quantity: number): Promise<Result<{ quantity: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Please log in to use the cart.") };

  const product = await getProductRow(productId);
  if (!product) return { success: false, error: await te("Product not found.") };

  const next = clampQuantity(quantity, product.moq);
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/cart");
  return { success: true, data: { quantity: next } };
}

export async function removeCartItem(productId: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Please log in to use the cart.") };

  const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/cart");
  return { success: true };
}

/** Moves a guest's browser cart into their account after they log in. */
export async function mergeGuestCart(lines: { productId: string; quantity: number }[]): Promise<Result> {
  const { user } = await requireUser();
  if (!user) return { success: false, error: await te("Not logged in.") };
  for (const line of lines.slice(0, 100)) {
    if (typeof line.productId === "string" && Number.isFinite(line.quantity)) {
      await addToCart(line.productId, line.quantity);
    }
  }
  return { success: true };
}

// ========================================================
// Checkout
// ========================================================

export interface CheckoutInput {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  notes?: string;
  /** Spend the affiliate wallet balance on this order. */
  useWallet?: boolean;
}

/**
 * Turns the cart into an order. Every price is recomputed here from the
 * products table — the browser's numbers are never trusted.
 */
export async function placeOrder(
  input: CheckoutInput
): Promise<Result<{ orderId: string; orderNumber: string; walletUsed: number; paid: boolean }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Please log in to place an order.") };
  if (!(await rateLimit(`order:${user.id}`, 10, 600))) return { success: false, error: await te("Too many requests. Please wait a moment and try again.") };

  const customer = await getCurrentCustomer();
  if (!customer) return { success: false, error: await te("We couldn't find your customer profile.") };

  const fields = {
    fullName: input.fullName?.trim(),
    phone: input.phone?.trim(),
    country: input.country?.trim(),
    city: input.city?.trim(),
    address: input.address?.trim(),
  };
  if (Object.values(fields).some((v) => !v)) {
    return { success: false, error: await te("Please fill in your name, phone and delivery address.") };
  }
  if (Object.values(fields).some((v) => v!.length > 200) || (input.notes?.length ?? 0) > 2000) {
    return { success: false, error: await te("Some fields are too long.") };
  }

  const lines = await getCart();
  if (lines.length === 0) return { success: false, error: await te("Your cart is empty.") };

  let total = 0;
  let awaitingPrice = false;
  const items = lines.map((line) => {
    const quantity = clampQuantity(line.quantity, line.product.moq);
    const unit = unitPriceFor(line.product.priceTiers, quantity);
    if (!unit) awaitingPrice = true;
    const lineTotal = Math.round(unit * quantity * 100) / 100;
    total += lineTotal;
    return {
      product_id: line.product.id,
      product_name: line.product.name,
      product_slug: line.product.slug,
      quantity,
      unit_price: unit,
      total_price: lineTotal,
      image_url: line.product.images[0] ?? null,
    };
  });

  // Customers can't write orders directly (RLS); the server does it after
  // the checks above.
  const admin = createAdminClient();

  let order: { id: string; order_number: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const orderNumber = `AW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
    const { data, error } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        status: "pending",
        total_amount: Math.round(total * 100) / 100,
        currency: "USD",
        payment_status: "pending",
        source: "cart",
        awaiting_price: awaitingPrice,
        contact_phone: fields.phone,
        shipping_address: {
          fullName: fields.fullName,
          phone: fields.phone,
          country: fields.country,
          city: fields.city,
          address: fields.address,
        },
        notes: input.notes?.trim() || null,
      })
      .select("id, order_number")
      .single();
    if (data) order = data;
    else if (error && !error.message.includes("duplicate")) return { success: false, error: error.message };
  }
  if (!order) return { success: false, error: await te("Could not create the order. Please try again.") };

  const { data: insertedItems, error: itemsError } = await admin
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order!.id })))
    .select("id, product_id, product_name");
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { success: false, error: itemsError.message };
  }

  await recordAffiliateCommissions(order.id, user.id, insertedItems ?? []);

  // Affiliate wallet: pay part or all of the order with earned commissions.
  let walletUsed = 0;
  let paid = false;
  const orderTotal = Math.round(total * 100) / 100;
  if (input.useWallet && !awaitingPrice && orderTotal > 0) {
    const { data: spent } = await admin.rpc("affiliate_spend", {
      p_user: user.id,
      p_order: order.id,
      p_amount: orderTotal,
    });
    walletUsed = Number(spent ?? 0);
    if (walletUsed > 0 && walletUsed >= orderTotal - 0.005) {
      await admin.from("orders").update({ payment_status: "paid", status: "confirmed" }).eq("id", order.id);
      paid = true;
    }
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  // The language they're shopping in becomes their email language (until
  // they switch). Ignored before supabase/emails.sql has run.
  const shopLocale = await getLocale();
  await supabase.from("profiles").update({ locale: shopLocale }).eq("id", user.id).then(() => undefined, () => undefined);

  // Confirmation email, sent after the response so checkout isn't slowed down.
  const placedId = order.id;
  after(() => sendOrderPlacedEmail(placedId, { paidWithWallet: paid }));

  revalidatePath("/cart");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  return { success: true, data: { orderId: order.id, orderNumber: order.order_number, walletUsed, paid } };
}

/**
 * Creates pending commissions for order lines whose product page the buyer
 * opened through an affiliate link (last 30 days). Buyers never earn on
 * their own links. Commissions become available when the order is paid
 * (database trigger, supabase/affiliates.sql).
 */
async function recordAffiliateCommissions(
  orderId: string,
  buyerId: string,
  orderItems: { id: string; product_id: string | null; product_name: string }[]
) {
  const attribution = parseAttribution((await cookies()).get(AFFILIATE_COOKIE)?.value);
  const attributed = orderItems.filter((i) => i.product_id && attribution[i.product_id]);
  if (attributed.length === 0) return;

  const admin = createAdminClient();
  const codes = [...new Set(attributed.map((i) => attribution[i.product_id!].c))];
  const { data: affiliates, error } = await admin
    .from("affiliates")
    .select("user_id, code, commission_rate")
    .in("code", codes)
    .eq("status", "active");
  if (error || !affiliates?.length) return; // affiliates.sql not installed yet, or codes inactive

  const byCode = new Map(affiliates.map((a) => [a.code, a]));
  const rows = attributed
    .map((i) => {
      const aff = byCode.get(attribution[i.product_id!].c);
      if (!aff || aff.user_id === buyerId) return null;
      return {
        affiliate_user_id: aff.user_id,
        order_id: orderId,
        order_item_id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        rate: aff.commission_rate,
        status: "pending",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length) await admin.from("affiliate_commissions").insert(rows);
}

/** Staff: set the final price of a "price on request" order so the customer can pay. */
export async function confirmOrderPrice(orderId: string, totalAmount: number): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Unauthorized") };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const staffRoles = ["sales_rep", "operations_manager", "admin", "super_admin"];
  if (!profile || !staffRoles.includes(profile.role)) return { success: false, error: await te("Only staff can set prices.") };
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return { success: false, error: await te("Enter a valid amount.") };

  const { error } = await supabase
    .from("orders")
    .update({
      total_amount: Math.round(totalAmount * 100) / 100,
      awaiting_price: false,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

// ========================================================
// Product chat ("Chat now")
// ========================================================

/**
 * Opens (or reuses) the customer's conversation about a product and sends
 * their message. Returns the conversation id for the chat panel.
 */
export async function startProductChat(
  productId: string,
  content: string
): Promise<Result<{ conversationId: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: await te("Please log in to chat with the seller.") };
  if (!(await rateLimit(`conv:${user.id}`, 10, 3600))) return { success: false, error: await te("Too many requests. Please wait a moment and try again.") };

  const text = content.trim();
  if (!text) return { success: false, error: await te("Message is empty.") };
  if (text.length > 4000) return { success: false, error: await te("Message is too long.") };

  const customer = await getCurrentCustomer();
  if (!customer) return { success: false, error: await te("We couldn't find your customer profile.") };

  const product = await getProductRow(productId);
  if (!product) return { success: false, error: await te("Product not found.") };

  const conversationId = await findProductConversation(productId);
  let id = conversationId;

  if (!id) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: customer.id,
        user_id: user.id,
        product_id: productId,
        subject: `Product inquiry: ${product.name}`.slice(0, 200),
        tags: ["product-inquiry"],
        priority: "normal",
        status: "open",
      })
      .select("id")
      .single();
    if (error || !data) return { success: false, error: error?.message ?? (await te("Could not start the chat.")) };
    id = data.id;

    // First message carries the product so staff see what it's about.
    await sendMessage({
      conversationId: id!,
      content: `About: ${product.name} — /products/${product.slug}`,
    });
  }

  const sent = await sendMessage({ conversationId: id!, content: text });
  if (!sent.success) return { success: false, error: sent.error ?? (await te("Message not sent.")) };

  return { success: true, data: { conversationId: id! } };
}

/** The customer's open conversation about this product, if any. */
export async function findProductConversation(productId: string): Promise<string | null> {
  const { supabase, user } = await requireUser();
  if (!user) return null;
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .in("status", ["open", "pending_agent"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
