"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Share2, Loader2, Coins } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";
import { useCurrency } from "@/lib/currency-context";
import { getMyAffiliate, joinAffiliateProgram, trackAffiliateVisit, type MyAffiliate } from "@/app/actions/affiliate";
import { AFFILIATE_RATE, affiliateLink } from "@/lib/affiliate";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

/** Records a visit that arrived through ?ref=CODE (sets the attribution cookie). */
export function AffiliateTracker({ code, productId }: { code?: string; productId: string }) {
  useEffect(() => {
    if (code) trackAffiliateVisit(code, productId);
  }, [code, productId]);
  return null;
}

/**
 * "Share & earn" card on product pages: affiliates get their personal link,
 * logged-in customers can join in one click, guests are invited to sign up.
 */
export function AffiliateShareCard({
  productSlug,
  productName,
  unitPrice,
}: {
  productSlug: string;
  productName: string;
  unitPrice: number;
}) {
  const { userId } = useNotifications();
  const { formatPrice } = useCurrency();
  const { t, format } = useI18n();
  const A = t.product.affiliate;
  const [affiliate, setAffiliate] = useState<MyAffiliate | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getMyAffiliate().then((a) => active && setAffiliate(a));
    return () => {
      active = false;
    };
  }, [userId]);

  const rate = affiliate?.rate ?? AFFILIATE_RATE;
  const perUnit = unitPrice * rate;
  const link = affiliate ? affiliateLink(typeof window !== "undefined" ? window.location.origin : "", productSlug, affiliate.code) : "";

  async function join() {
    setJoining(true);
    setError(null);
    const res = await joinAffiliateProgram();
    if (res.success && res.data) setAffiliate({ code: res.data.code, rate: AFFILIATE_RATE, status: "active" });
    else if (!res.success) setError(res.error);
    setJoining(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the link is visible to copy manually
    }
  }

  async function share() {
    const text = format(A.shareText, { name: productName });
    try {
      if (navigator.share) await navigator.share({ title: productName, text, url: link });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`, "_blank", "noopener");
    } catch {
      // share sheet cancelled
    }
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-gold/30 bg-gold-light/60">
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
          <Coins className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{format(A.title, { n: Math.round(rate * 100) })}</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {perUnit > 0
              ? format(A.earnPerUnit, { price: formatPrice(perUnit) })
              : A.earnGeneric}
          </p>

          {!userId ? (
            <Link
              href={`/login?redirect=${encodeURIComponent("/dashboard/affiliate")}`}
              className="mt-3 inline-flex h-9 items-center rounded-full bg-navy px-4 text-xs font-semibold text-white hover:bg-navy-light"
            >
              {A.loginForLink}
            </Link>
          ) : affiliate === undefined ? (
            <Loader2 className="mt-3 h-4 w-4 animate-spin text-navy" />
          ) : affiliate === null ? (
            <button
              onClick={join}
              disabled={joining}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-navy px-4 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-60"
            >
              {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {A.join}
            </button>
          ) : affiliate.status !== "active" ? (
            <p className="mt-3 text-xs font-medium text-error">{A.suspended}</p>
          ) : (
            <div className="mt-3 animate-[fade-in_0.3s_ease-out]">
              <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-white py-1 pl-4 pr-1">
                <span className="min-w-0 flex-1 truncate text-xs text-text-secondary" title={link}>
                  {link.replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={copy}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                    copied ? "bg-success text-white" : "bg-navy text-white hover:bg-navy-light"
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? A.copied : A.copy}
                </button>
                <button
                  onClick={share}
                  aria-label={A.shareLink}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-navy hover:brightness-95"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Link href="/dashboard/affiliate" className="mt-2 inline-block text-xs font-medium text-navy underline underline-offset-4">
                {A.viewEarnings}
              </Link>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
