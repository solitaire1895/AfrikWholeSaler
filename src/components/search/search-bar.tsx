"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useDeferredValue,
  useId,
  Fragment,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, ArrowRight, Clock, TrendingUp, LayoutGrid, ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import { useI18n } from "@/i18n/client";
import { categoryName, subCategoryName } from "@/i18n/names";
import {
  loadSearchEngine,
  loadPopularSearches,
  matchTerms,
  phraseKey,
  logSearch,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  type SearchEngine,
  type SearchIndexProduct,
  type CategoryHit,
} from "@/lib/search-engine";

const MAX_COMPLETIONS = 8;
const MAX_PRODUCTS = 3;

/** Server autocomplete row, used only until the catalog index is ready. */
interface ServerSuggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  image: string | null;
  price: number;
}

type Option =
  | { kind: "completion"; id: string; text: string; source: "recent" | "popular" | "catalog" }
  | { kind: "category"; id: string; cat: CategoryHit }
  | { kind: "product"; id: string; product: SearchIndexProduct };

function toIndexProduct(s: ServerSuggestion): SearchIndexProduct {
  return { id: s.id, n: s.name, s: s.slug, c: s.category, cs: s.categorySlug, sc: null, img: s.image, p: s.price, r: 0 };
}

/**
 * Google-style emphasis: the part the user already typed stays regular,
 * everything the suggestion adds is bold.
 */
function Completion({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <span className="font-semibold">{text}</span>;
  return (
    <>
      {at > 0 && <span className="font-semibold">{text.slice(0, at)}</span>}
      <span>{text.slice(at, at + q.length)}</span>
      {at + q.length < text.length && <span className="font-semibold">{text.slice(at + q.length)}</span>}
    </>
  );
}

function OptionItem({
  id,
  active,
  onHover,
  onPick,
  className,
  children,
}: {
  id: string;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()} // keep focus in the input
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "group flex cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors",
        active ? "bg-brand-light" : "hover:bg-surface-secondary/70",
        className
      )}
    >
      {children}
    </li>
  );
}

export function SearchBar({
  className,
  onNavigate,
  autoFocus,
}: {
  className?: string;
  /** Called after the user picks a result (e.g. to close the mobile menu). */
  onNavigate?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { t, format } = useI18n();
  const S = t.shop.search;
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [engine, setEngine] = useState<SearchEngine | null>(null);
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [server, setServer] = useState<{ q: string; items: ServerSuggestion[] } | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keeps typing smooth even if suggestions ever take a few ms.
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery.trim();

  // --- Load the catalog index and popular searches early ---
  const warmUp = () => {
    if (!engine) loadSearchEngine().then(setEngine).catch(() => {});
    loadPopularSearches().then(setPopular);
  };

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const start = () => {
      loadSearchEngine().then(setEngine).catch(() => {});
      loadPopularSearches().then(setPopular);
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(start, 1500);
    return () => clearTimeout(t);
  }, []);

  // --- "/" or Ctrl/Cmd+K focuses search from anywhere ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        if (!inputRef.current || inputRef.current.offsetParent === null) return; // only the visible bar
        e.preventDefault();
        inputRef.current.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Close when clicking outside ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Instant local results ---
  const localProducts = useMemo(
    () => (engine && trimmed ? engine.search(trimmed, MAX_PRODUCTS) : null),
    [engine, trimmed]
  );

  // --- Server fallback until the index has loaded (or if it is partial) ---
  const needServer =
    trimmed.length >= 2 && (!engine || (!engine.complete && (localProducts?.total ?? 0) < MAX_PRODUCTS));

  useEffect(() => {
    if (!needServer) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setServerLoading(true);
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setServer({ q: trimmed, items: data.suggestions || [] });
      } catch {
        // aborted or failed — keep whatever is shown
      } finally {
        if (!controller.signal.aborted) setServerLoading(false);
      }
    }, 120);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [needServer, trimmed]);

  // --- Build the dropdown ---
  const options: Option[] = useMemo(() => {
    // Before typing: recent searches, trending searches, popular categories.
    if (!trimmed) {
      const seen = new Set<string>();
      const out: Option[] = [];
      for (const text of recent.slice(0, 5)) {
        seen.add(phraseKey(text));
        out.push({ kind: "completion", id: `r-${text}`, text, source: "recent" });
      }
      for (const text of popular) {
        if (out.length >= 8) break;
        if (seen.has(phraseKey(text))) continue;
        seen.add(phraseKey(text));
        out.push({ kind: "completion", id: `p-${text}`, text, source: "popular" });
      }
      for (const cat of engine?.topCategories(4) ?? []) {
        out.push({ kind: "category", id: `c-${cat.slug}`, cat });
      }
      return out;
    }

    // While typing: completions (recent → popular → catalog), then products.
    const seen = new Set<string>();
    const completions: Option[] = [];
    const push = (text: string, source: "recent" | "popular" | "catalog") => {
      const key = phraseKey(text);
      if (!key || seen.has(key) || completions.length >= MAX_COMPLETIONS) return;
      seen.add(key);
      completions.push({ kind: "completion", id: `${source[0]}-${key}`, text, source });
    };
    matchTerms(recent, trimmed, 3).forEach((t) => push(t, "recent"));
    matchTerms(popular, trimmed, 5).forEach((t) => push(t, "popular"));
    engine?.suggest(trimmed, MAX_COMPLETIONS).forEach((t) => push(t, "catalog"));
    if (!engine && server?.q === trimmed) {
      server.items.forEach((s) => push(s.name.toLowerCase(), "catalog"));
    }

    const products: Option[] = (localProducts?.products ?? []).map((hit) => ({
      kind: "product",
      id: `prod-${hit.product.id}`,
      product: hit.product,
    }));
    if (needServer && server?.q === trimmed) {
      for (const s of server.items) {
        if (products.length >= MAX_PRODUCTS || products.some((p) => p.id === `prod-${s.id}`)) continue;
        products.push({ kind: "product", id: `prod-${s.id}`, product: toIndexProduct(s) });
      }
    }

    return [...completions, ...products];
  }, [trimmed, recent, popular, engine, localProducts, needServer, server]);

  // While arrowing through completions, preview the suggestion in the box (like Google).
  const activeOption = options[activeIndex];
  const inputValue = activeOption?.kind === "completion" ? activeOption.text : query;

  // Prefetch the highlighted product's page so opening it feels instant.
  useEffect(() => {
    if (activeOption?.kind === "product") router.prefetch(`/products/${activeOption.product.s}`);
  }, [activeOption, router]);

  /** Puts a suggestion in the box (without searching) so the user can keep typing. */
  function fillWith(text: string) {
    setQuery(text + " ");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function close() {
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    onNavigate?.();
  }

  function goToSearch(term: string) {
    const q = term.trim();
    if (!q) return;
    addRecentSearch(q);
    logSearch(q, engine ? engine.search(q, 1).total : 0);
    setQuery(q);
    close();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function choose(opt: Option) {
    if (opt.kind === "completion") {
      goToSearch(opt.text);
    } else if (opt.kind === "category") {
      close();
      router.push(`/products?category=${opt.cat.slug}`);
    } else {
      if (query.trim()) {
        addRecentSearch(query);
        logSearch(query, localProducts?.total ?? 1);
      }
      setQuery("");
      close();
      router.push(`/products/${opt.product.s}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (options.length ? (i + 1 >= options.length ? -1 : i + 1) : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (options.length ? (i <= -1 ? options.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeOption) choose(activeOption);
      else goToSearch(query);
    } else if (e.key === "Escape") {
      if (activeIndex >= 0) setActiveIndex(-1);
      else if (query) setQuery("");
      else close();
    } else if ((e.key === "Tab" || e.key === "ArrowRight") && open && trimmed) {
      // Accept the top (or highlighted) completion and keep typing.
      const input = e.currentTarget;
      if (e.key === "ArrowRight" && input.selectionStart !== input.value.length) return;
      const target = activeOption?.kind === "completion" ? activeOption : options.find((o) => o.kind === "completion");
      if (target && target.kind === "completion" && target.text !== query) {
        e.preventDefault();
        setQuery(target.text + " ");
        setActiveIndex(-1);
      }
    }
  }

  const showDropdown = open && options.length > 0;
  const noMatches = open && !!trimmed && options.length === 0;
  const expanded = showDropdown || noMatches;

  // Small heading above each group, except typed completions (Google shows none).
  const heading = (opt: Option, prev: Option | undefined) => {
    if (prev?.kind === opt.kind) return null;
    if (opt.kind === "completion" && trimmed) return null;
    const label =
      opt.kind === "completion" ? S.recentTrending : opt.kind === "category" ? S.popularCategories : S.products;
    return (
      <li
        role="presentation"
        className={cn(
          "px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary",
          prev && "mt-1 border-t border-border"
        )}
      >
        <span className="flex items-center justify-between">
          {label}
          {opt.kind === "completion" && recent.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
              className="text-[11px] font-normal normal-case tracking-normal text-text-secondary hover:text-brand"
            >
              {S.clearHistory}
            </button>
          )}
        </span>
      </li>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)} onMouseEnter={warmUp}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch(inputValue);
        }}
      >
        <div
          className={cn(
            "relative border bg-surface transition-[border-radius,box-shadow,border-color]",
            expanded
              ? "z-50 rounded-t-[20px] border-border border-b-transparent shadow-[var(--shadow-dropdown)]"
              : "rounded-[var(--radius-input)] border-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
          )}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeOption?.id}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            autoFocus={autoFocus}
            value={inputValue}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={() => {
              warmUp();
              setRecent(getRecentSearches());
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={S.placeholder}
            className="h-10 w-full rounded-[inherit] bg-transparent pl-10 pr-16 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {inputValue ? (
            <button
              type="button"
              aria-label={S.clear}
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-[10px] font-medium text-text-disabled lg:block">
              /
            </kbd>
          )}
          {/* Thin progress line instead of a spinner, so suggestions never blink */}
          {serverLoading && (
            <span className="absolute inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full">
              <span className="block h-full w-1/3 animate-[search-progress_1s_ease-in-out_infinite] bg-brand/60" />
            </span>
          )}
        </div>
      </form>

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain rounded-b-[20px] border border-t-0 border-border bg-surface pb-2 shadow-[var(--shadow-dropdown)]"
        >
          <li role="presentation" className="mx-4 border-t border-border" />
          {noMatches && (
            <li role="presentation" className="px-4 py-4 text-sm text-text-secondary">
              {serverLoading ? S.searching : format(S.pressEnter, { q: trimmed })}
            </li>
          )}
          {options.map((opt, i) => {
            const itemProps = {
              id: `${listId}-${opt.id}`,
              active: i === activeIndex,
              onHover: () => setActiveIndex(i),
              onPick: () => choose(opt),
            };

            return (
              <Fragment key={opt.id}>
                {heading(opt, options[i - 1])}

                {opt.kind === "completion" && (
                  <OptionItem {...itemProps}>
                    {opt.source === "recent" ? (
                      <Clock className="h-4 w-4 shrink-0 text-text-disabled" />
                    ) : opt.source === "popular" && !trimmed ? (
                      <TrendingUp className="h-4 w-4 shrink-0 text-text-disabled" />
                    ) : (
                      <Search className="h-4 w-4 shrink-0 text-text-disabled" />
                    )}
                    <span className="flex-1 truncate text-[15px] text-text-primary">
                      {trimmed ? <Completion text={opt.text} query={trimmed} /> : opt.text}
                    </span>
                    {/* Put this suggestion in the box without searching yet */}
                    <button
                      type="button"
                      aria-label={format(S.use, { q: opt.text })}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        fillWith(opt.text);
                      }}
                      className={cn(
                        "rounded p-1 text-text-disabled transition-opacity hover:text-brand",
                        i === activeIndex ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <ArrowUpLeft className="h-4 w-4" />
                    </button>
                  </OptionItem>
                )}

                {opt.kind === "category" && (
                  <OptionItem {...itemProps}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand">
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-primary">{opt.cat.name}</span>
                      <span className="block text-xs text-text-secondary">
                        {opt.cat.count} product{opt.cat.count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-disabled" />
                  </OptionItem>
                )}

                {opt.kind === "product" && (
                  <OptionItem {...itemProps}>
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                      {opt.product.img && (
                        <Image src={opt.product.img} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">{opt.product.n}</span>
                      <span className="block truncate text-xs text-text-secondary">
                        {opt.product.sc
                          ? `${categoryName(t, opt.product.cs, opt.product.c)} · ${subCategoryName(t, null, opt.product.sc)}`
                          : categoryName(t, opt.product.cs, opt.product.c)}
                      </span>
                    </span>
                    {opt.product.p > 0 && (
                      <span className="shrink-0 text-sm font-semibold text-navy">{formatPrice(opt.product.p)}</span>
                    )}
                  </OptionItem>
                )}
              </Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
