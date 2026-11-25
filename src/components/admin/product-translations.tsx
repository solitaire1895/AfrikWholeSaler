"use client";

import { useState } from "react";
import { Camera, ChevronDown, Languages, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { locales, localeNames } from "@/i18n/config";
import type { Product } from "@/types";

/**
 * Name/description per language inside the product form. Inputs are named
 * tr_<lang>_name / tr_<lang>_description; read them with readTranslations().
 */
export function TranslationFields({ product }: { product?: Product | null }) {
  const { t, format } = useI18n();
  const T = t.discovery.translations;
  const filled = locales.filter((l) => product?.translations?.[l]?.name || product?.translations?.[l]?.description).length;
  return (
    <details className="group rounded-[var(--radius-input)] border border-border" open={filled > 0}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-navy">
        <Languages className="h-4 w-4 text-brand" />
        {T.title}
        {filled > 0 && <span className="rounded-full bg-brand-light px-2 text-xs text-brand">{filled}/{locales.length}</span>}
        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border p-4">
        <p className="text-xs text-text-secondary">{T.hint}</p>
        {locales.map((lang) => (
          <div key={lang} className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary">
              {format(T.name, { lang: localeNames[lang] })}
              <input
                type="text"
                name={`tr_${lang}_name`}
                lang={lang}
                defaultValue={product?.translations?.[lang]?.name ?? ""}
                maxLength={200}
                className="mt-1.5 h-10 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-text-secondary">
              {format(T.description, { lang: localeNames[lang] })}
              <textarea
                name={`tr_${lang}_description`}
                lang={lang}
                rows={2}
                defaultValue={product?.translations?.[lang]?.description ?? ""}
                maxLength={5000}
                className="mt-1.5 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </label>
          </div>
        ))}
      </div>
    </details>
  );
}

export function readTranslations(formData: FormData): NonNullable<Product["translations"]> {
  const out: NonNullable<Product["translations"]> = {};
  for (const lang of locales) {
    const name = String(formData.get(`tr_${lang}_name`) ?? "").trim();
    const description = String(formData.get(`tr_${lang}_description`) ?? "").trim();
    if (name || description) out[lang] = { ...(name && { name }), ...(description && { description }) };
  }
  return out;
}

/** Admin: embeds every product photo for camera search, batch by batch. */
export function PhotoIndexButton() {
  const { t, format } = useI18n();
  const T = t.discovery.translations;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    let total = 0;
    setDone(0);
    try {
      for (let i = 0; i < 400; i++) {
        const res = await fetch("/api/search/image/index", { method: "POST" });
        const json = (await res.json().catch(() => ({}))) as { indexed?: number; remaining?: number; error?: string };
        if (!res.ok) throw new Error(json.error || String(res.status));
        total += json.indexed ?? 0;
        setDone(total);
        // Stop when finished, or when a batch made no progress (unreadable photos).
        if (!json.remaining || !json.indexed) break;
      }
      setMessage(format(T.indexDone, { n: total }));
    } catch (err) {
      setMessage(format(T.indexFailed, { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      title={message ?? T.indexText}
      className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm font-semibold text-navy transition-colors hover:bg-surface-secondary disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      {busy ? format(T.indexing, { n: done }) : message ?? T.indexCta}
    </button>
  );
}
