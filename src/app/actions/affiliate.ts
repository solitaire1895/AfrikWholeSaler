"use server";

import { te, tdb } from "@/i18n/errors";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startPayout, refreshPayout, type PayoutOutcome } from "@/lib/affiliate-payouts";
import {
  AFFILIATE_COOKIE,
  ATTRIBUTION_DAYS,
  isValidCode,
  parseAttribution,
  serializeAttribution,
} from "@/lib/affiliate";

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const ADMIN_ROLES = ["admin", "super_admin", "operations_manager"];

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ========================================================
// Visitors
// ========================================================

/**
 * Called when someone opens a product page with ?ref=CODE. Records the click
 * and remembers (for 30 days, in an httpOnly cookie) which affiliate sent
 * them to this product.
 */
export async function trackAffiliateVisit(code: string, productId: string): Promise<void> {
  if (!isValidCode(code) || !/^[0-9a-f-]{36}$/i.test(productId)) return;

  const store = await cookies();
  const attribution = parseAttribution(store.get(AFFILIATE_COOKIE)?.value);
  const existing = attribution[productId];
  const upper = code.toUpperCase();

  // Same link seen recently — don't count the click twice.
  if (existing?.c === upper && Date.now() - existing.t < 86_400_000) return;

  const { supabase, user } = await currentUser();
  const { data: affiliateUserId } = await supabase.rpc("record_affiliate_click", {
    p_code: upper,
    p_product: productId,
  });
  if (!affiliateUserId || affiliateUserId === user?.id) return; // unknown code or own link

  attribution[productId] = { c: upper, t: Date.now() };
  store.set(AFFILIATE_COOKIE, serializeAttribution(attribution), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ATTRIBUTION_DAYS * 86_400,
  });
}

// ========================================================
// Affiliates
// ========================================================

export interface MyAffiliate {
  code: string;
  rate: number;
  status: string;
}

/** The current user's affiliate profile, or null if they haven't joined. */
export async function getMyAffiliate(): Promise<MyAffiliate | null> {
  const { supabase, user } = await currentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("affiliates")
    .select("code, commission_rate, status")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? { code: data.code, rate: Number(data.commission_rate), status: data.status } : null;
}

export async function joinAffiliateProgram(): Promise<Result<{ code: string }>> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: await te("Please log in to join the affiliate program.") };
  const { data, error } = await supabase.rpc("join_affiliate_program");
  if (error || !data) return { success: false, error: error?.message ?? (await te("Could not join the program.")) };
  revalidatePath("/dashboard/affiliate");
  return { success: true, data: { code: data as string } };
}

export interface AffiliateDashboard {
  affiliate: MyAffiliate;
  balanceUsd: number;
  pendingUsd: number;
  earnedUsd: number;
  clicks: number;
  sales: number;
  xafRate: number; // 1 XAF in USD
  commissions: {
    id: string;
    productName: string | null;
    orderId: string;
    amountUsd: number;
    status: string;
    createdAt: string;
  }[];
  ledger: { id: string; amountUsd: number; type: string; note: string | null; createdAt: string }[];
  withdrawals: {
    id: string;
    amountXaf: number;
    network: string;
    phone: string;
    country: string;
    status: string;
    adminNote: string | null;
    createdAt: string;
  }[];
}

export async function getAffiliateDashboard(): Promise<AffiliateDashboard | null> {
  const { supabase, user } = await currentUser();
  if (!user) return null;
  const affiliate = await getMyAffiliate();
  if (!affiliate) return null;

  const [balance, rate, commissions, ledger, withdrawals, clicks] = await Promise.all([
    supabase.rpc("affiliate_balance", { p_user: user.id }),
    supabase.rpc("xaf_rate_to_usd"),
    supabase
      .from("affiliate_commissions")
      .select("id, product_name, order_id, amount_usd, rate, status, created_at, order_items(total_price)")
      .eq("affiliate_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("affiliate_ledger")
      .select("id, amount_usd, type, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("affiliate_withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_user_id", user.id),
  ]);

  const commissionRows = (commissions.data ?? []) as unknown as Array<{
    id: string;
    product_name: string | null;
    order_id: string;
    amount_usd: number;
    rate: number;
    status: string;
    created_at: string;
    order_items: { total_price: number } | null;
  }>;

  // Pending commissions don't have a final amount yet — estimate from the line total.
  const estimate = (c: (typeof commissionRows)[number]) =>
    c.status === "pending" ? Math.round(Number(c.order_items?.total_price ?? 0) * Number(c.rate) * 100) / 100 : Number(c.amount_usd);

  return {
    affiliate,
    balanceUsd: Number(balance.data ?? 0),
    pendingUsd: commissionRows.filter((c) => c.status === "pending").reduce((s, c) => s + estimate(c), 0),
    earnedUsd: commissionRows.filter((c) => c.status === "available").reduce((s, c) => s + Number(c.amount_usd), 0),
    clicks: clicks.count ?? 0,
    sales: commissionRows.filter((c) => c.status === "available" || c.status === "pending").length,
    xafRate: Number(rate.data ?? 0.0017),
    commissions: commissionRows.map((c) => ({
      id: c.id,
      productName: c.product_name,
      orderId: c.order_id,
      amountUsd: estimate(c),
      status: c.status,
      createdAt: c.created_at,
    })),
    ledger: (ledger.data ?? []).map((l) => ({
      id: l.id,
      amountUsd: Number(l.amount_usd),
      type: l.type,
      note: l.note,
      createdAt: l.created_at,
    })),
    withdrawals: (withdrawals.data ?? []).map((w) => ({
      id: w.id,
      amountXaf: Number(w.amount_xaf),
      network: w.network,
      phone: w.phone,
      country: w.country ?? "CM",
      status: w.status,
      adminNote: w.admin_note,
      createdAt: w.created_at,
    })),
  };
}

/** Wallet balance in USD for checkout (0 for non-affiliates). */
export async function getWalletBalance(): Promise<number> {
  const { supabase, user } = await currentUser();
  if (!user) return 0;
  const { data } = await supabase.rpc("affiliate_balance", { p_user: user.id });
  return Number(data ?? 0);
}

export async function requestWithdrawal(
  amountXaf: number,
  network: string,
  phone: string,
  country: string
): Promise<Result<{ id: string }>> {
  const { supabase, user } = await currentUser();
  if (!user) return { success: false, error: await te("Please log in.") };
  if (!Number.isFinite(amountXaf)) return { success: false, error: await te("Enter an amount.") };

  const { data, error } = await supabase.rpc("request_affiliate_withdrawal", {
    p_amount_xaf: Math.floor(amountXaf),
    p_network: network,
    p_phone: phone,
    p_country: country,
  });
  if (error) return { success: false, error: await tdb(error.message) };
  revalidatePath("/dashboard/affiliate");
  revalidatePath("/admin/affiliates");
  return { success: true, data: { id: data as string } };
}

// ========================================================
// Admin
// ========================================================

async function requireAdmin() {
  const { supabase, user } = await currentUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile && ADMIN_ROLES.includes(profile.role) ? { supabase, user } : null;
}

export interface AdminAffiliateRow {
  userId: string;
  code: string;
  status: string;
  rate: number;
  name: string;
  email: string;
  balanceUsd: number;
  earnedUsd: number;
  clicks: number;
  sales: number;
  joinedAt: string;
}

export interface AdminWithdrawalRow {
  id: string;
  userId: string;
  name: string;
  code: string;
  amountXaf: number;
  amountUsd: number;
  network: string;
  phone: string;
  country: string;
  status: string;
  adminNote: string | null;
  payoutError: string | null;
  payoutReference: string | null;
  createdAt: string;
}

export async function getAffiliateAdminData(): Promise<
  { affiliates: AdminAffiliateRow[]; withdrawals: AdminWithdrawalRow[] } | null
> {
  if (!(await requireAdmin())) return null;
  const admin = createAdminClient();

  const [affs, ledger, commissions, clicks, withdrawals] = await Promise.all([
    admin.from("affiliates").select("user_id, code, status, commission_rate, created_at").order("created_at", { ascending: false }),
    admin.from("affiliate_ledger").select("user_id, amount_usd"),
    admin.from("affiliate_commissions").select("affiliate_user_id, amount_usd, status"),
    admin.from("affiliate_clicks").select("affiliate_user_id"),
    admin
      .from("affiliate_withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const ids = (affs.data ?? []).map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, email, first_name, last_name").in("id", ids)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const sum = <T,>(rows: T[] | null, key: (r: T) => string, val: (r: T) => number, filter?: (r: T) => boolean) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) if (!filter || filter(r)) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
    return m;
  };
  const balances = sum(ledger.data, (r) => r.user_id, (r) => Number(r.amount_usd));
  const earned = sum(commissions.data, (r) => r.affiliate_user_id, (r) => Number(r.amount_usd), (r) => r.status === "available");
  const sales = sum(commissions.data, (r) => r.affiliate_user_id, () => 1, (r) => r.status === "available" || r.status === "pending");
  const clickCounts = sum(clicks.data, (r) => r.affiliate_user_id, () => 1);

  const nameOf = (id: string) => {
    const p = profileMap.get(id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email : "—";
  };
  const codeOf = new Map((affs.data ?? []).map((a) => [a.user_id, a.code]));

  return {
    affiliates: (affs.data ?? []).map((a) => ({
      userId: a.user_id,
      code: a.code,
      status: a.status,
      rate: Number(a.commission_rate),
      name: nameOf(a.user_id),
      email: profileMap.get(a.user_id)?.email ?? "",
      balanceUsd: balances.get(a.user_id) ?? 0,
      earnedUsd: earned.get(a.user_id) ?? 0,
      clicks: clickCounts.get(a.user_id) ?? 0,
      sales: sales.get(a.user_id) ?? 0,
      joinedAt: a.created_at,
    })),
    withdrawals: (withdrawals.data ?? []).map((w) => ({
      id: w.id,
      userId: w.user_id,
      name: nameOf(w.user_id),
      code: codeOf.get(w.user_id) ?? "",
      amountXaf: Number(w.amount_xaf),
      amountUsd: Number(w.amount_usd),
      network: w.network,
      phone: w.phone,
      country: w.country ?? "CM",
      status: w.status,
      adminNote: w.admin_note,
      payoutError: w.payout_error ?? null,
      payoutReference: w.payout_reference ?? null,
      createdAt: w.created_at,
    })),
  };
}

/** Admin: send a withdrawal to the affiliate's Mobile Money through SasPay. */
export async function payWithdrawalViaSaspay(id: string): Promise<Result<PayoutOutcome>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: await te("Only admins can process withdrawals.") };
  const outcome = await startPayout(id, ctx.user.id);
  revalidatePath("/admin/affiliates");
  revalidatePath("/dashboard/affiliate");
  return { success: true, data: outcome };
}

/** Admin: re-check a payout with SasPay (or re-send one that got no answer). */
export async function checkWithdrawalPayout(id: string): Promise<Result<PayoutOutcome>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: await te("Only admins can process withdrawals.") };
  try {
    const outcome = await refreshPayout(id);
    revalidatePath("/admin/affiliates");
    revalidatePath("/dashboard/affiliate");
    return { success: true, data: outcome };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function processWithdrawal(
  id: string,
  action: "approve" | "paid" | "reject",
  note?: string
): Promise<Result> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: await te("Only admins can process withdrawals.") };
  const { error } = await ctx.supabase.rpc("process_affiliate_withdrawal", {
    p_id: id,
    p_action: action,
    p_note: note?.trim() || null,
  });
  if (error) return { success: false, error: await tdb(error.message) };
  revalidatePath("/admin/affiliates");
  return { success: true };
}

export async function setAffiliateStatus(userId: string, status: "active" | "suspended"): Promise<Result> {
  if (!(await requireAdmin())) return { success: false, error: await te("Only admins can do this.") };
  const { error } = await createAdminClient().from("affiliates").update({ status }).eq("user_id", userId);
  if (error) return { success: false, error: await tdb(error.message) };
  revalidatePath("/admin/affiliates");
  return { success: true };
}
