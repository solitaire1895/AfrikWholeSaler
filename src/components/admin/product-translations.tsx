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

/**
 * Embeds the product photos that aren't indexed yet, in this browser
 * (the server can't run the model). Returns how many were indexed.
 */
export async function indexPendingPhotos(onProgress?: (done: number) => void): Promise<number> {
  const { embedBlob, MODEL_TAG } = await import("@/lib/visual-search-client");
  let total = 0;
  const failed = new Set<string>();
  for (let round = 0; round < 500; round++) {
    const res = await fetch(`/api/search/image/index?model=${MODEL_TAG}`, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { items?: { id: string; url: string }[]; error?: string };
    if (!res.ok) throw new Error(json.error || String(res.status));
    const items = (json.items ?? []).filter((i) => !failed.has(i.id));
    if (items.length === 0) break;

    const batch: { id: string; url: string; embedding: number[] }[] = [];
    for (const item of items) {
      try {
        const photo = await fetch(item.url, { mode: "cors" });
        if (!photo.ok) throw new Error(String(photo.status));
        batch.push({ ...item, embedding: await embedBlob(await photo.blob()) });
      } catch {
        failed.add(item.id); // unreadable photo: skip it this run
      }
    }
    if (batch.length) {
      const save = await fetch("/api/search/image/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL_TAG, items: batch }),
      });
      if (!save.ok) throw new Error(((await save.json().catch(() => ({}))) as { error?: string }).error || String(save.status));
      total += batch.length;
      onProgress?.(total);
    }
  }
  return total;
}

/** Admin: indexes every product photo for camera search. */
export function PhotoIndexButton() {
  const { t, format } = useI18n();
  const T = t.discovery.translations;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    setDone(0);
    try {
      const total = await indexPendingPhotos(setDone);
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
