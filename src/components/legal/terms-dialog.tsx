"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FileText, ShieldCheck, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { LegalSection } from "@/components/legal/legal-page";
import { cn } from "@/lib/utils";

/** Bump when the terms change materially: stored with each acceptance. */
export const TERMS_VERSION = "2026-11";

function rich(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

function Sections({ sections }: { sections: Record<string, LegalSection> }) {
  return (
    <>
      {Object.entries(sections).map(([key, s]) => (
        <section key={key} className="mb-5">
          <h4 className="mb-1.5 text-sm font-bold text-navy">{s.title}</h4>
          {s.intro && <p className="mb-2 text-sm leading-relaxed text-text-secondary">{rich(s.intro)}</p>}
          {s.subs &&
            Object.entries(s.subs).map(([k, sub]) => (
              <p key={k} className="mb-2 text-sm leading-relaxed text-text-secondary">
                <strong className="text-text-primary">{sub.h}. </strong>
                {rich(sub.p)}
              </p>
            ))}
          {s.items && (
            <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {s.items.map((item, i) => (
                <li key={i}>{rich(item)}</li>
              ))}
            </ul>
          )}
          {s.outro && <p className="text-sm leading-relaxed text-text-secondary">{rich(s.outro)}</p>}
        </section>
      ))}
    </>
  );
}

/**
 * Terms of use + privacy policy in one scrollable dialog. "Accept" unlocks
 * once the visitor has scrolled to the end.
 */
export function TermsDialog({
  initial = "terms",
  onAccept,
  onClose,
}: {
  initial?: "terms" | "privacy";
  onAccept: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const D = t.discovery.terms;
  const scrollRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (initial === "privacy") privacyRef.current?.scrollIntoView();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [initial, onClose]);

  const check = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setAtEnd(true);
  };
  // Short screens / large text: the whole thing may already be visible.
  useEffect(check, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-[var(--shadow-dropdown)] sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="terms-dialog-title" className="text-base font-bold text-navy">
            {D.dialogTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label={D.decline} className="rounded-full p-2 text-text-secondary hover:bg-surface-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} onScroll={check} className="flex-1 overflow-y-auto px-5 py-4" tabIndex={0}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
            <FileText className="h-5 w-5 text-brand" />
            {t.legal.terms.title}
          </h3>
          <Sections sections={t.legal.terms.sections as Record<string, LegalSection>} />
          <div ref={privacyRef} className="mt-8 border-t border-border pt-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
              <ShieldCheck className="h-5 w-5 text-brand" />
              {t.legal.privacy.title}
            </h3>
            <Sections sections={t.legal.privacy.sections as Record<string, LegalSection>} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-secondary">{atEnd ? "" : D.scrollHint}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-11 rounded-[var(--radius-button)] px-4 text-sm font-medium text-text-secondary hover:bg-surface-secondary">
              {D.decline}
            </button>
            <button
              type="button"
              disabled={!atEnd}
              onClick={onAccept}
              className={cn(
                "h-11 flex-1 rounded-[var(--radius-button)] bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              )}
            >
              {D.accept}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
