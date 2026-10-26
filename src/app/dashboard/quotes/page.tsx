import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  MapPin,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentCustomer, getQuotesByCustomer } from "@/lib/queries";
import { formatPrice, cn } from "@/lib/utils";
import type { QuoteStatus } from "@/types";
import { getI18n } from "@/i18n/server";
import { countryName } from "@/i18n/names";

const statusConfig: Record<
  QuoteStatus,
  { color: string; icon: typeof Clock }
> = {
  Submitted: { color: "bg-info/10 text-info border-info/20", icon: Clock },
  "Under Review": {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  Quoted: {
    color: "bg-brand/10 text-brand border-brand/20",
    icon: FileText,
  },
  Accepted: {
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  Rejected: {
    color: "bg-error/10 text-error border-error/20",
    icon: XCircle,
  },
  Expired: {
    color: "bg-surface-secondary text-text-disabled border-border",
    icon: XCircle,
  },
};

export default async function QuotesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const quoteRequests = await getQuotesByCustomer(customer.id);
  const { t, format, formatDate, formatNumber } = await getI18n();
  const Q = t.account.quotes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {Q.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {Q.lead}
          </p>
        </div>
        <ButtonLink href="/quote" variant="primary" size="md">
          <FileText className="h-4 w-4" />
          {Q.newQuote}
        </ButtonLink>
      </div>

      {/* Quotes List */}
      {quoteRequests.length > 0 ? (
        <div className="space-y-3">
          {quoteRequests.map((quote) => {
            const config = statusConfig[quote.status];
            const StatusIcon = config.icon;
            return (
              <Card key={quote.id} hover className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-secondary">
                    <Package className="h-6 w-6 text-text-secondary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {quote.productName}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                          config.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {(t.status.quote as Record<string, string>)[quote.status] ?? quote.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                      <span>
                        {Q.quantity}{" "}
                        <span className="font-medium text-text-primary">
                          {format(Q.units, { n: formatNumber(quote.quantity) })}
                        </span>
                      </span>
                      {quote.targetPrice > 0 && (
                        <span>
                          {Q.target}{" "}
                          <span className="font-medium text-text-primary">
                            {format(Q.perUnit, { price: formatPrice(quote.targetPrice) })}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {countryName(t, quote.destinationCountry)}
                      </span>
                      <span>
                        {formatDate(quote.createdAt)}
                      </span>
                    </div>
                    {quote.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {quote.attachments.map((att) => (
                          <span
                            key={att}
                            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-secondary px-2 py-1 text-xs text-text-secondary"
                          >
                            <FileText className="h-3 w-3" />
                            {att}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {quote.status === "Quoted" && (
                    <ButtonLink
                      href="/dashboard/messages"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                    >
                      {Q.viewQuote}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </ButtonLink>
                  )}
                  {(quote.status === "Submitted" ||
                    quote.status === "Under Review") && (
                    <span className="text-xs text-text-secondary shrink-0 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Q.awaiting}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mx-auto mb-4">
            <FileText className="h-8 w-8 text-text-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">
            {Q.emptyTitle}
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            {Q.emptyText}
          </p>
          <ButtonLink href="/quote" variant="primary" size="md">
            {Q.request}
          </ButtonLink>
        </Card>
      )}
    </div>
  );
}