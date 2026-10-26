"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useSyncExternalStore, ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";
import { CURRENCIES, DEFAULT_CURRENCY, formatAmount, type CurrencyInfo } from "@/lib/currencies";

// ========================================================
// Display currency for the whole site. Prices are stored in USD; the visitor
// picks a currency (remembered in this browser) and every price converts.
// ========================================================

const STORAGE_KEY = "preferred_currency";
const CHANGE_EVENT = "aw:currency-change";

function readSaved(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

function subscribe(onChange: () => void) {
  // Other tabs (storage) and this tab (custom event) both update the choice.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

interface CurrencyContextValue {
  currency: string;
  info: CurrencyInfo;
  currencies: CurrencyInfo[];
  setCurrency: (code: string) => void;
  convertPrice: (priceInUsd: number) => number;
  formatPrice: (priceInUsd: number) => string;
  formatPriceWithSymbol: (priceInUsd: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // The server always renders USD; the saved choice applies right after hydration.
  const saved = useSyncExternalStore(subscribe, readSaved, () => DEFAULT_CURRENCY);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(CURRENCIES);
  // Digits are grouped the way the visitor's language expects (1 234,50 in French).
  const numberLocale = intlLocale[useI18n().locale];

  // Live rates from the database override the built-in defaults.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const { data, error } = await createClient()
          .from("currencies")
          .select("code, symbol, rate_to_usd, per_usd, is_active");
        if (error || !data?.length || !active) return;
        const rows = new Map(
          (data as { code: string; symbol: string; rate_to_usd: number | null; per_usd: number | null; is_active: boolean }[]).map((r) => [r.code, r])
        );
        setCurrencies(
          CURRENCIES.flatMap((cur) => {
            const row = rows.get(cur.code);
            if (!row) return [cur];
            if (!row.is_active) return [];
            const perUsd = Number(row.per_usd) || (Number(row.rate_to_usd) ? 1 / Number(row.rate_to_usd) : 0);
            return [{ ...cur, perUsd: perUsd > 0 ? perUsd : cur.perUsd }];
          })
        );
      } catch {
        // keep the built-in rates
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage blocked — choice lasts until the page reloads
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const info =
      currencies.find((c) => c.code === saved) ?? currencies.find((c) => c.code === DEFAULT_CURRENCY) ?? CURRENCIES[0];
    const convertPrice = (priceInUsd: number) => priceInUsd * info.perUsd;
    const formatPrice = (priceInUsd: number) => formatAmount(convertPrice(priceInUsd), info, numberLocale);
    return {
      currency: info.code,
      info,
      currencies,
      setCurrency,
      convertPrice,
      formatPrice,
      formatPriceWithSymbol: formatPrice,
    };
  }, [saved, currencies, numberLocale, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
}
