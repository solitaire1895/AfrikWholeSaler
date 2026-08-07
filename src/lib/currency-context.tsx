"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const FALLBACK_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", rateToUsd: 1.0 },
  { code: "EUR", name: "Euro", symbol: "€", rateToUsd: 1.08 },
  { code: "GBP", name: "British Pound", symbol: "£", rateToUsd: 1.27 },
  { code: "XAF", name: "CFA Franc BEAC", symbol: "FCFA", rateToUsd: 0.0017 },
  { code: "XOF", name: "CFA Franc BCEAO", symbol: "CFA", rateToUsd: 0.0017 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rateToUsd: 0.0007 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateToUsd: 0.0078 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rateToUsd: 0.065 },
  { code: "ZAR", name: "South African Rand", symbol: "R", rateToUsd: 0.054 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", rateToUsd: 0.20 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", rateToUsd: 0.73 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rateToUsd: 0.14 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", rateToUsd: 0.012 },
  { code: "AED", name: "UAE Dirham", symbol: "AED", rateToUsd: 0.272 },
];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("USD");
  const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency");
    if (saved) setCurrencyState(saved);
  }, []);

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("currencies")
          .select("code, name, symbol, rate_to_usd")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          setCurrencies(data.map((c: { code: string; name: string; symbol: string; rate_to_usd: number }) => ({
            code: c.code, name: c.name, symbol: c.symbol, rateToUsd: Number(c.rate_to_usd),
          })));
        }
      } catch { /* keep fallback */ }
    }
    fetchCurrencies();
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem("preferred_currency", code);
  }, []);

  const convertPrice = useCallback((priceInUsd: number): number => {
    const target = currencies.find((c) => c.code === currency);
    if (!target || target.rateToUsd === 0) return priceInUsd;
    return priceInUsd / target.rateToUsd;
  }, [currency, currencies]);

  const formatPrice = useCallback((priceInUsd: number): string => {
    const converted = convertPrice(priceInUsd);
    const target = currencies.find((c) => c.code === currency);
    const symbol = target?.symbol || "$";
    if (currency === "XAF" || currency === "XOF" || currency === "JPY") {
      return `${symbol} ${Math.round(converted).toLocaleString("en-US")}`;
    }
    return `${symbol} ${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convertPrice, currency, currencies]);

  return (
    <CurrencyContext.Provider value={{ currency, currencies, setCurrency, convertPrice, formatPrice, formatPriceWithSymbol: formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
}

const CurrencyContext = createContext<{
  currency: string;
  currencies: { code: string; name: string; symbol: string; rateToUsd: number }[];
  setCurrency: (code: string) => void;
  convertPrice: (priceInUsd: number) => number;
  formatPrice: (priceInUsd: number) => string;
  formatPriceWithSymbol: (priceInUsd: number) => string;
} | null>(null);
