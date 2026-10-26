"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Loader2, Headphones, Package, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import { useNotifications } from "@/lib/notifications-context";
import { useSupportOnline } from "@/lib/chat";
import { findProductConversation, startProductChat } from "@/app/actions/cart";
import { unitPriceFor } from "@/lib/pricing";
import { ChatThread } from "@/components/chat/chat-thread";
import type { Product } from "@/types";
import { useI18n } from "@/i18n/client";


/**
 * Slide-over chat with the seller about one product (Alibaba "Chat now").
 * Reuses the customer's open conversation about this product if there is one.
 */
export function ProductChat({
  product,
  quantity,
  open,
  onClose,
}: {
  product: Product;
  quantity: number;
  open: boolean;
  onClose: () => void;
}) {
  const { userId, setActiveConversation } = useNotifications();
  const { t, format } = useI18n();
  const C = t.product.chat;
  const QUICK_QUESTIONS = [C.q1, C.q2, C.q3, C.q4];
  const { formatPrice } = useCurrency();
  const online = useSupportOnline(open);
  // undefined = still looking for an existing conversation
  const [conversationId, setConversationId] = useState<string | null | undefined>(undefined);
  const [asking, setAsking] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId || conversationId !== undefined) return;
    let active = true;
    findProductConversation(product.id).then((id) => active && setConversationId(id));
    return () => {
      active = false;
    };
  }, [open, userId, conversationId, product.id]);

  // No toast/sound for messages in the chat that's on screen.
  useEffect(() => {
    setActiveConversation(open ? (conversationId ?? null) : null);
  }, [open, conversationId, setActiveConversation]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function ask(question: string) {
    setAsking(question);
    const res = await startProductChat(product.id, question);
    if (res.success) setConversationId(res.data!.conversationId);
    setAsking(null);
  }

  const unit = unitPriceFor(product.priceTiers, quantity);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-navy/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={format(C.dialogLabel, { name: product.name })}
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-surface shadow-[var(--shadow-modal)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white">
            <Headphones className="h-5 w-5" />
            <span
              className={cn(
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                online ? "bg-success" : "bg-text-disabled"
              )}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy">{C.team}</p>
            <p className="text-xs text-text-secondary">
              {online ? C.online : C.offline}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={C.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product context */}
        <div className="flex items-center gap-3 border-b border-border bg-cream/60 px-5 py-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
            {product.images[0] ? (
              <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <Package className="m-3 h-6 w-6 text-text-disabled" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
            <p className="text-xs text-text-secondary">
              {format(C.context, {
                price: unit ? `${formatPrice(unit)} ${t.product.perUnit}` : t.product.priceOnRequest,
                n: quantity,
                moq: product.moq,
              })}
            </p>
          </div>
        </div>

        {/* Body */}
        {!userId ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <MessageCircle className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-navy">{C.loginTitle}</h3>
            <p className="mt-2 text-sm text-text-secondary">{C.loginText}</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/products/${product.slug}?chat=1`)}`}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              {C.loginButton}
            </Link>
            <Link href="/register" className="mt-3 text-sm text-text-secondary hover:text-brand">
              {C.registerLink}
            </Link>
          </div>
        ) : conversationId === undefined ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <ChatThread
            conversationId={conversationId}
            viewer="customer"
            autoFocus={open}
            placeholder={C.placeholder}
            onCreate={async (text) => {
              const res = await startProductChat(product.id, text);
              if (!res.success) return { error: res.error };
              setConversationId(res.data!.conversationId);
              return { id: res.data!.conversationId };
            }}
            emptyState={
              <div className="animate-[fade-in-up_0.5s_ease-out]">
                <p className="text-center text-sm text-text-secondary">{C.intro}</p>
                <div className="mt-5 flex flex-col gap-2">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      disabled={!!asking}
                      style={{ animationDelay: `${i * 70}ms` }}
                      className="flex animate-[fade-in-up_0.5s_ease-out_both] items-center justify-between gap-2 rounded-full border border-border px-4 py-2 text-left text-sm text-text-primary transition-colors hover:border-brand/40 hover:bg-brand-light disabled:opacity-60"
                    >
                      {q}
                      {asking === q && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        )}
      </aside>
    </>
  );
}
