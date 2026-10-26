"use client";

import { useState, useTransition } from "react";
import { FileText, Clock, CheckCircle, XCircle, MapPin, Package, ArrowRight, X, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { respondToQuote, updateQuoteStatus } from "@/app/actions/crud";
import type { QuoteRequest, QuoteStatus } from "@/types";
import { useI18n } from "@/i18n/client";
import { countryName } from "@/i18n/names";

const statusConfig: Record<QuoteStatus, { color: string; icon: typeof Clock }> = {
  Submitted: { color: "bg-info/10 text-info border-info/20", icon: Clock },
  "Under Review": { color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  Quoted: { color: "bg-brand/10 text-brand border-brand/20", icon: FileText },
  Accepted: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  Rejected: { color: "bg-error/10 text-error border-error/20", icon: XCircle },
  Expired: { color: "bg-surface-secondary text-text-disabled border-border", icon: XCircle },
};

interface QuotesManagerProps {
  quotes: QuoteRequest[];
}

export function QuotesManager({ quotes }: QuotesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<QuoteRequest | null>(null);
  const { t, format, formatDate, formatNumber } = useI18n();
  const Q = t.admin.quotes;
  const C = t.admin.common;

  function handleStartReview(quoteId: string) {
    startTransition(async () => {
      const result = await updateQuoteStatus(quoteId, "under_review");
      if (!result.success) {
        setError(result.error || C.failed);
      } else {
        window.location.reload();
      }
    });
  }

  function handleRespond(formData: FormData) {
    startTransition(async () => {
      const result = await respondToQuote(
        respondingTo!.id,
        parseFloat(formData.get("quotedPrice") as string),
        parseInt(formData.get("deliveryDays") as string),
        formData.get("staffResponse") as string
      );
      if (result.success) {
        setRespondingTo(null);
        window.location.reload();
      } else {
        setError(result.error || C.failed);
      }
    });
  }

  function handleAccept(quoteId: string) {
    startTransition(async () => {
      const result = await updateQuoteStatus(quoteId, "accepted");
      if (!result.success) {
        setError(result.error || C.failed);
      } else {
        window.location.reload();
      }
    });
  }

  function handleReject(quoteId: string) {
    startTransition(async () => {
      const result = await updateQuoteStatus(quoteId, "rejected");
      if (!result.success) {
        setError(result.error || C.failed);
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">{Q.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {Q.lead}
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {quotes.length > 0 ? (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const config = statusConfig[quote.status];
            const StatusIcon = config.icon;
            return (
              <Card key={quote.id} hover className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-secondary">
                    <Package className="h-6 w-6 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-primary">{quote.productName}</h3>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", config.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {(t.status.quote as Record<string, string>)[quote.status] ?? quote.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                      <span>{Q.qty} <span className="font-medium text-text-primary">{formatNumber(quote.quantity)}</span></span>
                      {quote.targetPrice > 0 && <span>{Q.target} <span className="font-medium text-text-primary">{format(C.perUnit, { price: formatPrice(quote.targetPrice) })}</span></span>}
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{countryName(t, quote.destinationCountry)}</span>
                      <span>{formatDate(quote.createdAt, { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {quote.status === "Submitted" && (
                      <button
                        onClick={() => handleStartReview(quote.id)}
                        disabled={isPending}
                        className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border px-4 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {Q.startReview}
                      </button>
                    )}
                    {(quote.status === "Submitted" || quote.status === "Under Review") && (
                      <button
                        onClick={() => setRespondingTo(quote)}
                        disabled={isPending}
                        className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {Q.sendQuote}
                      </button>
                    )}
                    {quote.status === "Quoted" && (
                      <>
                        <button
                          onClick={() => handleAccept(quote.id)}
                          disabled={isPending}
                          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] bg-success px-4 text-xs font-semibold text-white hover:bg-success/90 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {Q.markAccepted}
                        </button>
                        <button
                          onClick={() => handleReject(quote.id)}
                          disabled={isPending}
                          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-error/20 px-4 text-xs font-medium text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {Q.reject}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">{Q.none}</p>
        </Card>
      )}

      {/* Quote Response Modal */}
      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-navy">{Q.modalTitle}</h2>
                <p className="text-sm text-text-secondary mt-1">{respondingTo.productName}</p>
              </div>
              <button
                onClick={() => setRespondingTo(null)}
                aria-label={C.close}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 rounded-[var(--radius-sm)] border border-border bg-surface-secondary/30 p-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary">{Q.quantity}</span>{" "}
                  <span className="font-medium text-text-primary">{format(C.units, { n: formatNumber(respondingTo.quantity) })}</span>
                </div>
                <div>
                  <span className="text-text-secondary">{Q.destination}</span>{" "}
                  <span className="font-medium text-text-primary">{countryName(t, respondingTo.destinationCountry)}</span>
                </div>
                {respondingTo.targetPrice > 0 && (
                  <div>
                    <span className="text-text-secondary">{Q.targetPrice}</span>{" "}
                    <span className="font-medium text-text-primary">{format(C.perUnit, { price: formatPrice(respondingTo.targetPrice) })}</span>
                  </div>
                )}
              </div>
            </div>

            <form action={handleRespond} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{Q.quotedPrice}</label>
                  <input
                    type="number"
                    name="quotedPrice"
                    min={0}
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{Q.deliveryDays}</label>
                  <input
                    type="number"
                    name="deliveryDays"
                    min={1}
                    required
                    placeholder="30"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{Q.message}</label>
                <textarea
                  name="staffResponse"
                  rows={4}
                  required
                  placeholder={Q.messagePlaceholder}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRespondingTo(null)}
                  className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  {C.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? Q.sending : Q.sendQuote}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}