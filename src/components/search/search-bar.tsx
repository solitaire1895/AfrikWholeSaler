"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  image: string | null;
  price: number;
  similarity?: number;
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced autocomplete fetch
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce keystrokes (200ms per the algorithm spec)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(query), 200);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      router.push(`/products/${suggestions[activeIndex].slug}`);
      setShowSuggestions(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-8 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-[var(--radius-md)] border border-border bg-surface shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/products/${s.slug}`);
                      setShowSuggestions(false);
                      setQuery("");
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      activeIndex === i ? "bg-brand-light" : "hover:bg-surface-secondary/50"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                      {s.image ? (
                        <Image src={s.image} alt={s.name} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    {/* Name + category */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                      <p className="text-xs text-text-secondary">{s.category}</p>
                    </div>
                    {/* Price */}
                    <span className="text-sm font-semibold text-navy shrink-0">
                      {formatPrice(s.price)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-disabled shrink-0" />
                  </button>
                </li>
              ))}
              {/* View all results */}
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-brand hover:bg-brand-light transition-colors"
                >
                  View all results for "{query}"
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">No products found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
