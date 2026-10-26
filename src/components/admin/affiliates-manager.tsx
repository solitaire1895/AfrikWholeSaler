"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Smartphone, Check, X, Copy, Users, Wallet, Coins, Clock, Send, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  processWithdrawal,
  payWithdrawalViaSaspay,
  checkWithdrawalPayout,
  setAffiliateStatus,
  type AdminAffiliateRow,
  type AdminWithdrawalRow,
} from "@/app/actions/affiliate";
import { networkLabel } from "@/lib/affiliate";
import type { PayoutOutcome } from "@/lib/affiliate-payouts";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";

const statusStyle: Record<string, string> = {
  requested: "bg-warning/10 text-warning",
  approved: "bg-info/10 text-info",
  processing: "bg-info/10 text-info",
  failed: "bg-error/10 text-error",
  paid: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  active: "bg-success/10 text-success",
  suspended: "bg-error/10 text-error",
};

export function AffiliatesManager({
  affiliates,
  withdrawals,
}: {
  affiliates: AdminAffiliateRow[];
  withdrawals: AdminWithdrawalRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { t, format, formatNumber, formatDate, locale } = useI18n();
  const countryName = (code: string) => new Intl.DisplayNames([intlLocale[locale]], { type: "region" }).of(code) ?? code;
  const A = t.admin.affiliates;
  const statusLabel = (st: string) => (A.statuses as Record<string, string>)[st] ?? st;
  const fmtUsd = (n: number) => `$${formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtXaf = (n: number) => `${formatNumber(Math.floor(n))} FCFA`;
  const fmtDate = (iso: string) => formatDate(iso, { day: "numeric", month: "short", year: "numeric" });

  const open = withdrawals.filter((w) => ["requested", "approved", "processing"].includes(w.status));
  const shownWithdrawals = showAllWithdrawals ? withdrawals : open;

  const totals = useMemo(
    () => ({
      affiliates: affiliates.length,
      owed: affiliates.reduce((s, a) => s + Math.max(0, a.balanceUsd), 0),
      earned: affiliates.reduce((s, a) => s + a.earnedUsd, 0),
      pendingPayouts: open.reduce((s, w) => s + w.amountXaf, 0),
    }),
    [affiliates, open]
  );

  const filtered = affiliates.filter((a) => {
    const q = search.trim().toLowerCase();
    return !q || [a.name, a.email, a.code].some((v) => v.toLowerCase().includes(q));
  });

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.success) setError(res.error ?? t.admin.common.failed);
      else router.refresh();
    });
  }

  function outcomeNotice(o: PayoutOutcome): { ok: boolean; text: string } {
    switch (o.state) {
      case "paid":
        return { ok: true, text: A.outPaid };
      case "processing":
        return { ok: true, text: A.outProcessing };
      case "failed":
        return { ok: false, text: A.outFailed };
      case "released":
        return { ok: false, text: format(A.outReleased, { error: o.error }) };
      case "unconfirmed":
        return { ok: false, text: A.outUnconfirmed };
      default:
        return { ok: false, text: A.outUnavailable };
    }
  }

  // Pay via SasPay, or re-check a payout in progress.
  function payout(w: AdminWithdrawalRow, mode: "pay" | "check") {
    if (
      mode === "pay" &&
      !window.confirm(
        format(A.confirmPay, {
          amount: fmtXaf(w.amountXaf),
          phone: w.phone,
          network: networkLabel(w.network),
          country: countryName(w.country),
        })
      )
    )
      return;
    setError(null);
    setNotice(null);
    setBusyId(w.id);
    startTransition(async () => {
      const res = mode === "pay" ? await payWithdrawalViaSaspay(w.id) : await checkWithdrawalPayout(w.id);
      setBusyId(null);
      if (!res.success) return setError(res.error);
      setNotice(outcomeNotice(res.data!));
      router.refresh();
    });
  }

  function reject(w: AdminWithdrawalRow) {
    const note = window.prompt(format(A.rejectPrompt, { amount: fmtXaf(w.amountXaf), name: w.name }));
    if (note === null) return;
    run(() => processWithdrawal(w.id, "reject", note));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">{A.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {A.lead}
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm",
            notice.ok ? "border-success/20 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-navy"
          )}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label={t.admin.common.dismiss}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
          <button onClick={() => setError(null)} aria-label={t.admin.common.dismiss}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Users, label: A.count, value: formatNumber(totals.affiliates) },
          { icon: Coins, label: A.earned, value: fmtUsd(totals.earned) },
          { icon: Wallet, label: A.owed, value: fmtUsd(totals.owed) },
          { icon: Clock, label: A.toPay, value: fmtXaf(totals.pendingPayouts) },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xl font-bold text-navy">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Withdrawals */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-navy">
            {A.withdrawals} {open.length > 0 && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{open.length}</span>}
          </h2>
          <button onClick={() => setShowAllWithdrawals((v) => !v)} className="text-xs font-medium text-text-secondary hover:text-brand">
            {showAllWithdrawals ? A.showOpen : A.showHistory}
          </button>
        </div>
        {shownWithdrawals.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-text-secondary">{A.noWithdrawals}</p>
        ) : (
          <ul className="divide-y divide-border">
            {shownWithdrawals.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Smartphone className="h-5 w-5 shrink-0 text-text-disabled" />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-navy">
                    {fmtXaf(w.amountXaf)} <span className="font-normal text-text-secondary">({fmtUsd(w.amountUsd)})</span>
                  </p>
                  <p className="text-xs text-text-secondary">
                    {w.name} · {w.code} · {countryName(w.country)} · {fmtDate(w.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => copy(w.phone)}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs"
                  title={A.copyNumber}
                >
                  <span className="font-medium">{networkLabel(w.network)}</span>
                  <span className="font-mono">{w.phone}</span>
                  {copied === w.phone ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-text-disabled" />}
                </button>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ", statusStyle[w.status])}>{statusLabel(w.status)}</span>
                {(w.status === "requested" || w.status === "approved") && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => payout(w, "pay")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                    >
                      {busyId === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {A.pay}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => reject(w)}
                      className="h-8 rounded-full border border-error/30 px-3 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-50"
                    >
                      {A.reject}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (window.confirm(format(A.confirmManual, { amount: fmtXaf(w.amountXaf), phone: w.phone })))
                          run(() => processWithdrawal(w.id, "paid"));
                      }}
                      className="text-xs font-medium text-text-secondary underline-offset-2 hover:text-navy hover:underline disabled:opacity-50"
                    >
                      {A.markPaidManual}
                    </button>
                  </div>
                )}
                {w.status === "processing" && (
                  <button
                    disabled={isPending}
                    onClick={() => payout(w, "check")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-surface-secondary disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", busyId === w.id && "animate-spin")} />
                    {A.check}
                  </button>
                )}
                {(w.payoutError || w.payoutReference) && (
                  <p className="w-full pl-9 text-xs">
                    {w.payoutReference && <span className="text-text-secondary">{format(A.reference, { ref: w.payoutReference })} </span>}
                    {w.payoutError && w.status !== "paid" && (
                      <span className="text-error">{format(A.saspayError, { error: w.payoutError })}</span>
                    )}
                  </p>
                )}
                {w.adminNote && <p className="w-full pl-9 text-xs text-text-secondary">{format(A.note, { note: w.adminNote })}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Affiliates */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-semibold text-navy">{A.all}</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={A.search}
              className="h-10 w-full rounded-full border border-border pl-10 pr-4 text-sm focus:border-navy focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase text-text-secondary">
                <th className="px-5 py-3 font-semibold">{A.colAffiliate}</th>
                <th className="px-5 py-3 font-semibold">{A.colCode}</th>
                <th className="px-5 py-3 text-right font-semibold">{A.colVisits}</th>
                <th className="px-5 py-3 text-right font-semibold">{A.colSales}</th>
                <th className="px-5 py-3 text-right font-semibold">{A.colEarned}</th>
                <th className="px-5 py-3 text-right font-semibold">{A.colBalance}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.common.status}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-text-secondary">
                    {A.none}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.userId} className="hover:bg-surface-secondary/30">
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-primary">{a.name}</p>
                      <p className="text-xs text-text-secondary">{a.email} · {format(A.since, { date: fmtDate(a.joinedAt) })}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{a.code}</td>
                    <td className="px-5 py-3 text-right">{a.clicks}</td>
                    <td className="px-5 py-3 text-right">{a.sales}</td>
                    <td className="px-5 py-3 text-right">{fmtUsd(a.earnedUsd)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-navy">{fmtUsd(a.balanceUsd)}</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ", statusStyle[a.status])}>{statusLabel(a.status)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        disabled={isPending}
                        onClick={() => {
                          const next = a.status === "active" ? "suspended" : "active";
                          if (next === "active" || window.confirm(format(A.suspendConfirm, { name: a.name })))
                            run(() => setAffiliateStatus(a.userId, next));
                        }}
                        className="text-xs font-medium text-text-secondary hover:text-brand disabled:opacity-50"
                      >
                        {a.status === "active" ? A.suspend : A.reactivate}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
