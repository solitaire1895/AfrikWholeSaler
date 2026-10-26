"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { locales, localeNames, localeShort, type Locale } from "@/i18n/config";
import { setLocale } from "@/app/actions/locale";
import { localizePath, splitLocalePath } from "@/i18n/routing";

/**
 * Language picker. Saves the choice and moves to the same page in the new
 * language's URL (/products ↔ /en/products), without a full reload.
 */
export function LanguageSwitcher({
  tone = "light",
  align = "right",
  direction = "down",
}: {
  tone?: "light" | "dark";
  align?: "left" | "right";
  direction?: "down" | "up";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      const { path } = splitLocalePath(pathname || "/");
      router.push(localizePath(path, next) + window.location.search + window.location.hash);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.layout.switcher.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors",
          tone === "dark" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-text-primary hover:bg-surface-secondary"
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
        <span>{localeShort[locale]}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.layout.switcher.label}
          className={cn(
            "absolute z-[90] w-44 animate-[scale-in_0.15s_ease-out] overflow-hidden rounded-[16px] border border-border bg-surface py-1 text-text-primary shadow-[var(--shadow-dropdown)]",
            align === "right" ? "right-0" : "left-0",
            direction === "down" ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                lang={l}
                onClick={() => choose(l)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-surface-secondary",
                  l === locale && "font-semibold text-navy"
                )}
              >
                {localeNames[l]}
                {l === locale && <Check className="h-4 w-4 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
