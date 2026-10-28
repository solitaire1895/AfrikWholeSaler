"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slide-over filter panel: opens over the page from the right, so the product
 * grid never moves. Closes on backdrop click and Escape; the page behind
 * doesn't scroll while it's open.
 */
export function FilterDrawer({
  open,
  onClose,
  title,
  closeLabel,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[80]", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-navy/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col rounded-l-[24px] bg-surface shadow-[var(--shadow-modal)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight text-navy">{title}</h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2">{children}</div>
        {footer && <div className="border-t border-border bg-surface px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** One group of options ("Categories", "Availability"…), separated by hairlines. */
export function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-5 last:border-b-0">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

/** A selectable option: dot indicator, label, optional count pill. */
export function FilterOption({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-brand-light font-medium text-navy" : "text-text-secondary hover:bg-surface-secondary hover:text-navy"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          active ? "border-brand bg-brand" : "border-border group-hover:border-navy/40"
        )}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
            active ? "bg-white text-brand" : "bg-surface-secondary text-text-disabled"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Removable chip for an active filter, shown above the grid. */
export function FilterChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex animate-[scale-in_0.2s_ease-out] items-center gap-1.5 rounded-full border border-navy/15 bg-surface py-1 pl-3 pr-1 text-xs font-medium text-navy">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel}: ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
