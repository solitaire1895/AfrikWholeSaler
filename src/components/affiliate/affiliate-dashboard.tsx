"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Coins,
  Link2,
  MousePointerClick,
  ShoppingBag,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Check,
  Copy,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/notifications-context";
import { joinAffiliateProgram, requestWithdrawal, type AffiliateDashboard } from "@/app/actions/affiliate";
import { MIN_WITHDRAWAL_XAF, PAYOUT_COUNTRIES, AFFILIATE_RATE, networkLabel, payoutCountry } from "@/lib/affiliate";
import { intlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

/** Money/date formatting in the reader's language. */
function useFormats() {
  const { formatNumber, formatDate } = useI18n();
  return {
    fmtUsd: (n: number) => formatNumber(n, { style: "currency", currency: "USD" }),
    fmtXaf: (n: number) => `${formatNumber(Math.floor(n))} FCFA`,
    fmtDate: (iso: string) => formatDate(iso),
  };
}

const statusStyle: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  available: "bg-success/10 text-success",
  cancelled: "bg-surface-secondary text-text-secondary",
  reversed: "bg-error/10 text-error",
  requested: "bg-warning/10 text-warning",
  approved: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  processing: "bg-info/10 text-info",
  failed: "bg-error/10 text-error",
};


// ========================================================
// Not an affiliate yet
// ========================================================

export function AffiliateJoin() {
  const router = useRouter();
  const { t, format } = useI18n();
  const A = t.account.affiliate;
  const { fmtXaf } = useFormats();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setJoining(true);
    setError(null);
    const res = await joinAffiliateProgram();
    if (res.success) router.refresh();
    else {
      setError(res.error);
      setJoining(false);
    }
  }

  const steps = [
    { icon: Link2, title: A.step1Title, text: A.step1Text },
    { icon: ShoppingBag, title: A.step2Title, text: format(A.step2Text, { n: AFFILIATE_RATE * 100 }) },
    { icon: Wallet, title: A.step3Title, text: format(A.step3Text, { amount: fmtXaf(MIN_WITHDRAWAL_XAF) }) },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-navy p-8 text-white sm:p-10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(circle at 90% 20%, rgba(244,180,0,0.45) 0%, transparent 45%)" }}
        />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" /> {A.badge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {format(A.joinTitle, { n: AFFILIATE_RATE * 100 })}
          </h1>
          <p className="mt-3 text-white/70">{A.joinText}</p>
          <button
            onClick={join}
            disabled={joining}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-navy transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
            {A.join}
          </button>
          {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            style={{ animationDelay: `${i * 80}ms` }}
            className="animate-[fade-in-up_0.5s_ease-out_both] rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-light text-gold">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold text-navy">{s.title}</h3>
            <p className="mt-1 text-sm text-text-secondary">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================================
// Affiliate dashboard
// ========================================================

export function AffiliateDashboardView({ data }: { data: AffiliateDashboard }) {
  const router = useRouter();
  const { t, format } = useI18n();
  const A = t.account.affiliate;
  const { fmtUsd, fmtXaf, fmtDate } = useFormats();
  const statusLabel = (s: string) => (A.statuses as Record<string, string>)[s] ?? s;
  const { userId } = useNotifications();
  const [tab, setTab] = useState<"commissions" | "wallet" | "withdrawals">("commissions");
  const [copied, setCopied] = useState(false);

  const balanceXaf = data.xafRate > 0 ? data.balanceUsd / data.xafRate : 0;
  const progress = Math.min(1, balanceXaf / MIN_WITHDRAWAL_XAF);
  const inProgress = data.withdrawals.find((w) => ["requested", "approved", "processing"].includes(w.status));

  // Refresh live when money moves (new commission, withdrawal processed…).
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`affiliate-ledger:${userId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "affiliate_ledger", filter: `user_id=eq.${userId}` }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "affiliate_withdrawals", filter: `user_id=eq.${userId}` }, () =>
        router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.affiliate.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">{A.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {format(A.lead, { n: Math.round(data.affiliate.rate * 100) })}
          </p>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm"
          title={A.codeTitle}
        >
          <span className="text-text-secondary">{A.code}</span>
          <span className="font-mono font-semibold text-navy">{data.affiliate.code}</span>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-text-disabled" />}
        </button>
      </div>

      {data.affiliate.status !== "active" && (
        <p className="rounded-[var(--radius-md)] bg-error/10 p-4 text-sm text-error">
          {A.suspended}
        </p>
      )}

      {/* Balance + withdraw */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-navy p-6 text-white lg:col-span-3">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "radial-gradient(circle at 85% 15%, rgba(244,180,0,0.45) 0%, transparent 45%)" }}
          />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Wallet className="h-4 w-4" /> {A.available}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{fmtXaf(balanceXaf)}</p>
            <p className="text-sm text-white/60">≈ {fmtUsd(data.balanceUsd)}</p>

            <div className="mt-6">
              <div className="flex justify-between text-xs text-white/70">
                <span>{progress >= 1 ? A.canWithdraw : A.progress}</span>
                <span>{fmtXaf(MIN_WITHDRAWAL_XAF)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-1000 ease-out"
                  style={{ width: `${Math.max(2, progress * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/products"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-navy hover:brightness-95"
              >
                <Link2 className="h-4 w-4" /> {A.findProducts}
              </Link>
              {data.balanceUsd > 0 && (
                <Link
                  href="/products"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10"
                >
                  <ShoppingBag className="h-4 w-4" /> {A.spend}
                </Link>
              )}
            </div>
          </div>
        </div>

        <WithdrawCard
          balanceXaf={balanceXaf}
          inProgress={
            inProgress
              ? format(A.inProgressDetails, { amount: fmtXaf(inProgress.amountXaf), phone: inProgress.phone, status: statusLabel(inProgress.status) })
              : null
          }
          disabled={data.affiliate.status !== "active"}
          onDone={() => router.refresh()}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Clock, label: A.pending, value: fmtUsd(data.pendingUsd), hint: A.pendingHint },
          { icon: Coins, label: A.earned, value: fmtUsd(data.earnedUsd) },
          { icon: ShoppingBag, label: A.sales, value: String(data.sales) },
          { icon: MousePointerClick, label: A.visits, value: String(data.clicks) },
        ].map((s, i) => (
          <div
            key={s.label}
            title={s.hint}
            style={{ animationDelay: `${i * 60}ms` }}
            className="animate-[fade-in-up_0.5s_ease-out_both] rounded-[var(--radius-lg)] border border-border bg-surface p-4"
          >
            <s.icon className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xl font-bold text-navy">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="flex gap-1 border-b border-border p-2">
          {(
            [
              ["commissions", A.tabCommissions],
              ["wallet", A.tabWallet],
              ["withdrawals", A.tabWithdrawals],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === key ? "bg-navy text-white" : "text-text-secondary hover:text-navy"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "commissions" && (
          <ul className="divide-y divide-border">
            {data.commissions.length === 0 ? (
              <Empty text={A.noSales} />
            ) : (
              data.commissions.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{c.productName ?? A.product}</span>
                    <span className="text-xs text-text-secondary">{fmtDate(c.createdAt)}</span>
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyle[c.status])}>
                    {statusLabel(c.status)}
                  </span>
                  <span className="w-20 text-right text-sm font-semibold text-navy">
                    {c.status === "pending" && c.amountUsd === 0 ? "—" : fmtUsd(c.amountUsd)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "wallet" && (
          <ul className="divide-y divide-border">
            {data.ledger.length === 0 ? (
              <Empty text={A.noMovements} />
            ) : (
              data.ledger.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      l.amountUsd >= 0 ? "bg-success/10 text-success" : "bg-brand-light text-brand"
                    )}
                  >
                    {l.amountUsd >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text-primary">{(A.ledger as Record<string, string>)[l.type] ?? l.type}</span>
                    <span className="block truncate text-xs text-text-secondary">
                      {l.note ? `${l.note} · ` : ""}
                      {fmtDate(l.createdAt)}
                    </span>
                  </span>
                  <span className={cn("text-sm font-semibold", l.amountUsd >= 0 ? "text-success" : "text-navy")}>
                    {l.amountUsd >= 0 ? "+" : "−"}
                    {fmtUsd(Math.abs(l.amountUsd))}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "withdrawals" && (
          <ul className="divide-y divide-border">
            {data.withdrawals.length === 0 ? (
              <Empty text={format(A.noWithdrawals, { amount: fmtXaf(MIN_WITHDRAWAL_XAF) })} />
            ) : (
              data.withdrawals.map((w) => (
                <li key={w.id} className="flex items-center gap-3 px-5 py-3">
                  <Smartphone className="h-5 w-5 shrink-0 text-text-disabled" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text-primary">
                      {fmtXaf(w.amountXaf)} · {networkLabel(w.network)}
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      {w.phone} · {fmtDate(w.createdAt)}
                      {w.adminNote ? ` · ${w.adminNote}` : ""}
                    </span>
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyle[w.status])}>
                    {statusLabel(w.status)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="px-5 py-10 text-center text-sm text-text-secondary">{text}</li>;
}

function WithdrawCard({
  balanceXaf,
  inProgress,
  disabled,
  onDone,
}: {
  balanceXaf: number;
  inProgress: string | null;
  disabled: boolean;
  onDone: () => void;
}) {
  const { t, format, locale } = useI18n();
  const A = t.account.affiliate;
  const { fmtXaf } = useFormats();
  const countryNames = new Intl.DisplayNames([intlLocale[locale]], { type: "region" });
  const max = Math.floor(balanceXaf);
  const eligible = max >= MIN_WITHDRAWAL_XAF && !inProgress && !disabled;
  const [amount, setAmount] = useState(String(Math.max(MIN_WITHDRAWAL_XAF, max)));
  const [country, setCountry] = useState<string>("CM");
  const [network, setNetwork] = useState<string>("orange");
  const networks = Object.keys(payoutCountry(country)?.methods ?? {});
  const dial = payoutCountry(country)?.dial ?? "";

  function changeCountry(code: string) {
    setCountry(code);
    const available = Object.keys(payoutCountry(code)?.methods ?? {});
    if (!available.includes(network)) setNetwork(available[0] ?? "");
  }
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await requestWithdrawal(Number(amount), network, phone, country);
    setSubmitting(false);
    if (res.success) {
      setMessage({ ok: true, text: A.requestSent });
      onDone();
    } else setMessage({ ok: false, text: res.error });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 lg:col-span-2"
    >
      <h2 className="flex items-center gap-2 font-semibold text-navy">
        <Smartphone className="h-5 w-5 text-gold" /> {A.withdrawTitle}
      </h2>

      {inProgress ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-info/10 p-3 text-sm text-navy">{format(A.inProgress, { details: inProgress })}</p>
      ) : !eligible ? (
        <p className="mt-3 text-sm text-text-secondary">
          {format(A.notYet, { min: fmtXaf(MIN_WITHDRAWAL_XAF), missing: fmtXaf(Math.max(0, MIN_WITHDRAWAL_XAF - balanceXaf)) })}
        </p>
      ) : null}

      <fieldset disabled={!eligible || submitting} className="mt-4 space-y-3 disabled:opacity-60">
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">{A.country}</span>
          <select
            value={country}
            onChange={(e) => changeCountry(e.target.value)}
            className="h-11 w-full cursor-pointer rounded-[12px] border border-border bg-surface px-3 text-sm focus:border-navy focus:outline-none"
          >
            {PAYOUT_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryNames.of(c.code) ?? c.code}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {networks.map((id) => (
            <button
              type="button"
              key={id}
              onClick={() => setNetwork(id)}
              aria-pressed={network === id}
              className={cn(
                "rounded-[12px] border px-3 py-2 text-xs font-medium transition-colors",
                network === id ? "border-navy bg-navy text-white" : "border-border hover:border-navy/40"
              )}
            >
              {networkLabel(id)}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">{A.number}</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={`+${dial} …`}
            className="h-11 w-full rounded-[12px] border border-border px-3 text-sm focus:border-navy focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">{format(A.amount, { max: fmtXaf(max) })}</span>
          <input
            required
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="h-11 w-full rounded-[12px] border border-border px-3 text-sm focus:border-navy focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {A.request}
        </button>
      </fieldset>

      {message && (
        <p className={cn("mt-3 text-sm", message.ok ? "text-success" : "text-error")} role="status">
          {message.text}
        </p>
      )}
    </form>
  );
}
