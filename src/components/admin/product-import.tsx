"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { importProducts } from "@/app/actions/crud";
import { importTemplate, readProductCsv, type ImportError, type ImportRow } from "@/lib/product-import";
import type { Category, SubCategory } from "@/types";
import { useI18n } from "@/i18n/client";

/**
 * CSV import: download the template, pick the filled file, check the preview,
 * create everything as drafts. Partners then only add photos and videos.
 */
export function ProductImport({
  categories,
  subCategories,
  onClose,
  onImported,
}: {
  categories: Category[];
  subCategories: SubCategory[];
  onClose: () => void;
  onImported: (created: number) => void;
}) {
  const { t, format } = useI18n();
  const I = t.adminCatalog.productImport;
  const C = t.admin.common;
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [serverFailed, setServerFailed] = useState<{ line: number; error: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const errorText = (e: ImportError) => format((I.errors as Record<string, string>)[e.code] ?? e.code, { value: e.value ?? "" });

  function downloadTemplate() {
    const blob = new Blob(["﻿" + importTemplate(categories, subCategories)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "afrikwholesaler-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setServerFailed([]);
    setServerError(null);
    const result = readProductCsv(await file.text(), categories, subCategories);
    setRows(result.rows);
    setErrors(result.errors);
  }

  function runImport() {
    startTransition(async () => {
      try {
        const res = await importProducts(rows);
        if (!res.success) {
          setServerError(res.error ?? C.failed);
          return;
        }
        if (res.failed?.length) {
          setServerFailed(res.failed);
          setRows((prev) => prev.filter((r) => res.failed!.some((f) => f.line === r.line)));
        }
        onImported(res.created ?? 0);
        if (!res.failed?.length) onClose();
      } catch (err) {
        setServerError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={() => !isPending && onClose()}>
      <Card className="flex max-h-[90vh] w-full max-w-3xl flex-col p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">{I.title}</h2>
          <button onClick={onClose} aria-label={C.close} className="text-text-secondary hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="mb-4 space-y-1 text-sm text-text-secondary">
          <li>1. {I.step1}</li>
          <li>2. {I.step2}</li>
          <li>3. {I.step3}</li>
        </ol>
        <p className="mb-4 rounded-[12px] bg-surface-secondary p-3 text-xs text-text-secondary">{I.priceHelp}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-navy hover:bg-surface-secondary"
          >
            <Download className="h-4 w-4" /> {I.template}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-navy hover:bg-surface-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" /> {fileName ?? I.choose}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {(errors.length > 0 || serverFailed.length > 0) && (
            <div className="mb-3 rounded-[12px] bg-error/10 p-3 text-sm text-error">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" /> {format(I.skipped, { count: errors.length + serverFailed.length })}
              </p>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs">
                {errors.map((e, i) => (
                  <li key={`c${i}`}>{format(I.line, { line: e.line })} {errorText(e)}</li>
                ))}
                {serverFailed.map((e, i) => (
                  <li key={`s${i}`}>{format(I.line, { line: e.line })} {e.error}</li>
                ))}
              </ul>
            </div>
          )}

          {rows.length > 0 && serverFailed.length === 0 && (
            <>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> {format(I.ready, { count: rows.length })}
              </p>
              <div className="overflow-x-auto rounded-[12px] border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-surface-secondary/60 text-left text-text-secondary">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">{I.colName}</th>
                      <th className="px-3 py-2">{I.colCategory}</th>
                      <th className="px-3 py-2">MOQ</th>
                      <th className="px-3 py-2">{I.colPrice}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 50).map((r) => (
                      <tr key={r.line}>
                        <td className="px-3 py-1.5 text-text-disabled">{r.line}</td>
                        <td className="px-3 py-1.5 text-text-primary">{r.name}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{categoryLabel(r.categoryId)}</td>
                        <td className="px-3 py-1.5">{r.moq}</td>
                        <td className="px-3 py-1.5">{r.priceTiers.map((p) => `$${p.price}`).join(" / ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && <p className="mt-1 text-xs text-text-disabled">{format(I.more, { count: rows.length - 50 })}</p>}
            </>
          )}
          {serverError && <p role="alert" className="mt-3 rounded-[12px] bg-error/10 p-3 text-sm text-error">{serverError}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <button onClick={onClose} disabled={isPending} className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary">
            {C.cancel}
          </button>
          <button
            onClick={runImport}
            disabled={isPending || rows.length === 0 || serverFailed.length > 0}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? I.importing : format(I.importCta, { count: rows.length })}
          </button>
        </div>
      </Card>
    </div>
  );
}
