"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCY_REGIONS } from "@/lib/currencies";

/** Countries using each currency, so visitors can search "Cameroun", "Kenya"… */
const COUNTRIES: Record<string, string[]> = {
  XAF: ["CM", "GA", "CG", "TD", "CF", "GQ"],
  XOF: ["SN", "CI", "BJ", "BF", "ML", "NE", "TG", "GW"],
  CDF: ["CD"], AOA: ["AO"], RWF: ["RW"], BIF: ["BI"], STN: ["ST"],
  NGN: ["NG"], GHS: ["GH"], GNF: ["GN"], SLE: ["SL"], LRD: ["LR"], GMD: ["GM"], CVE: ["CV"], MRU: ["MR"],
  KES: ["KE"], UGX: ["UG"], TZS: ["TZ"], ETB: ["ET"], SOS: ["SO"], DJF: ["DJ"], ERN: ["ER"], SSP: ["SS"],
  MGA: ["MG"], MUR: ["MU"], SCR: ["SC"], KMF: ["KM"],
  EGP: ["EG"], MAD: ["MA"], DZD: ["DZ"], TND: ["TN"], LYD: ["LY"], SDG: ["SD"],
  ZAR: ["ZA"], BWP: ["BW"], NAD: ["NA"], SZL: ["SZ"], LSL: ["LS"], ZMW: ["ZM"], MWK: ["MW"], MZN: ["MZ"], ZWG: ["ZW"],
  USD: ["US"], EUR: ["FR", "DE", "BE"], GBP: ["GB"], CNY: ["CN"],
};

/** Strips accents so "cote" finds "Côte d'Ivoire". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Display-currency picker: searchable, grouped by African region, names in
 * the visitor's language. The choice is remembered in this browser.
 */
export function CurrencySwitcher({
  tone = "light",
  align = "right",
  direction = "down",
  className,
}: {
  tone?: "light" | "dark";
  align?: "left" | "right";
  direction?: "down" | "up";
  className?: string;
}) {
  const { locale, t } = useI18n();
  const C = t.layout.currency;
  const { currency, info, currencies, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Currency and country names in the visitor's language, from the browser.
  const named = useMemo(() => {
    const lang = intlLocale[locale];
    const currencyNames = new Intl.DisplayNames([lang], { type: "currency" });
    const regionNames = new Intl.DisplayNames([lang], { type: "region" });
    return currencies.map((cur) => {
      const name = currencyNames.of(cur.code) ?? cur.code;
      const countries = (COUNTRIES[cur.code] ?? []).map((cc) => regionNames.of(cc) ?? cc);
      return { ...cur, name, haystack: fold([cur.code, cur.symbol, name, ...countries].join(" ")) };
    });
  }, [currencies, locale]);

  const groups = useMemo(() => {
    const q = fold(query.trim());
    const hits = q ? named.filter((c) => c.haystack.includes(q)) : named;
    return CURRENCY_REGIONS.map((region) => ({
      region,
      items: hits.filter((c) => c.region === region).sort((a, b) => a.name.localeCompare(b.name, intlLocale[locale])),
    })).filter((g) => g.items.length > 0);
  }, [named, query, locale]);

  function choose(code: string) {
    setCurrency(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${C.label} (${currency})`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 items-center gap-1 rounded-full px-2.5 text-sm font-medium transition-colors",
          tone === "dark" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-text-primary hover:bg-surface-secondary"
        )}
      >
        <span className="text-xs opacity-70">{info.symbol}</span>
        <span>{currency}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[90] w-[min(18rem,calc(100vw-2rem))] animate-[scale-in_0.15s_ease-out] overflow-hidden rounded-[16px] border border-border bg-surface text-text-primary shadow-[var(--shadow-dropdown)]",
            align === "right" ? "right-0" : "left-0",
            direction === "down" ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={C.search}
                aria-label={C.search}
                className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div role="listbox" aria-label={C.title} className="max-h-80 overflow-y-auto py-1">
            {groups.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">{C.none}</p>
            ) : (
              groups.map((g) => (
                <div key={g.region} role="group" aria-label={C.regions[g.region]}>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-disabled">
                    {C.regions[g.region]}
                  </p>
                  {g.items.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      role="option"
                      aria-selected={cur.code === currency}
                      onClick={() => choose(cur.code)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-surface-secondary",
                        cur.code === currency && "bg-brand-light/50"
                      )}
                    >
                      <span className="w-10 shrink-0 font-semibold text-navy">{cur.code}</span>
                      <span className="min-w-0 flex-1 truncate text-text-secondary">{cur.name}</span>
                      {cur.code === currency ? (
                        <Check className="h-4 w-4 shrink-0 text-brand" />
                      ) : (
                        <span className="shrink-0 text-xs text-text-disabled">{cur.symbol}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
