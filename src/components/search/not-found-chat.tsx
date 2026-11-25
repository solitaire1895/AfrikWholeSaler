"use client";

import Link from "next/link";
import { FileText, MessageCircle, SearchX } from "lucide-react";
import { OPEN_CHAT_EVENT } from "@/components/chat/chat-widget";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Shown whenever a search or filter finds nothing: invites the visitor to
 * chat with the team for a personalised order instead of leaving.
 */
export function NotFoundChat({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  const N = t.discovery.notFound;
  return (
    <div
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-brand/30 bg-brand-light/30 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-brand shadow-sm">
        <SearchX className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-navy">{N.title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{N.text}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <MessageCircle className="h-4 w-4" />
          {N.chat}
        </button>
        <Link
          href="/quote"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface px-6 text-sm font-semibold text-navy transition-colors hover:bg-surface-secondary"
        >
          <FileText className="h-4 w-4" />
          {N.quote}
        </Link>
      </div>
      {children}
    </div>
  );
}
