"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, ChevronLeft, ChevronRight, Headphones, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import { fetchConversationSummaries, useSupportOnline, type ConversationSummary } from "@/lib/chat";
import { SUPPORT_TOPICS } from "@/lib/chat-topics";
import { createSupportConversation } from "@/app/actions/chat";
import { ChatThread } from "@/components/chat/chat-thread";
import { useI18n } from "@/i18n/client";

/** Open the widget from anywhere: window.dispatchEvent(new Event(OPEN_CHAT_EVENT)) */
export const OPEN_CHAT_EVENT = "aw:open-chat";

type View = { kind: "home" } | { kind: "thread"; id: string | null; title: string; topic?: string };

const HIDDEN_ON = ["/admin", "/dashboard/messages", "/login", "/register"];

export function ChatWidget() {
  const pathname = usePathname();
  const { userId, isStaff, unreadChats, setActiveConversation } = useNotifications();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "home" });
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const online = useSupportOnline(open);
  const { t, format, timeAgo } = useI18n();
  const W = t.chat.widget;
  const topicName = (topic: string) => (t.chat.topics as Record<string, string>)[topic] ?? topic;

  // Open on demand (e.g. a "Chat with us" button elsewhere).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  // Refresh the conversation list whenever the home view is shown.
  useEffect(() => {
    if (!open || !userId || view.kind !== "home") return;
    let active = true;
    fetchConversationSummaries().then((list) => active && setConversations(list));
    return () => {
      active = false;
    };
  }, [open, userId, view.kind]);

  // No toast/sound for the conversation that's on screen.
  useEffect(() => {
    setActiveConversation(open && view.kind === "thread" ? view.id : null);
  }, [open, view, setActiveConversation]);

  if (isStaff || HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;

  const loginHref = `/login?redirect=${encodeURIComponent(pathname || "/")}`;

  return (
    <>
      {/* Panel */}
      <div
        role="dialog"
        aria-label={W.dialogLabel}
        aria-hidden={!open}
        className={cn(
          "fixed z-[65] flex flex-col overflow-hidden bg-surface shadow-[var(--shadow-modal)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "inset-0 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[380px] sm:rounded-[24px] sm:border sm:border-border",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-95 opacity-0 sm:origin-bottom-right"
        )}
      >
        {/* Header */}
        <div className="relative bg-navy px-5 pb-5 pt-4 text-white">
          <div className="flex items-center gap-2">
            {view.kind === "thread" && (
              <button
                onClick={() => setView({ kind: "home" })}
                aria-label={W.back}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Headphones className="h-5 w-5" />
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-navy",
                  online ? "bg-success" : "bg-white/40"
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{view.kind === "thread" ? topicName(view.title) : "AfrikWholesaler"}</p>
              <p className="text-xs text-white/70">
                {online ? W.onlineNow : W.replyHours}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={W.close}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!userId ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <MessageCircle className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-navy">{W.guestTitle}</h3>
            <p className="mt-2 text-sm text-text-secondary">{W.guestText}</p>
            <Link
              href={loginHref}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              {W.login}
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className="mt-3 text-sm text-text-secondary hover:text-brand">
              {W.register}
            </Link>
          </div>
        ) : view.kind === "home" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-5">
              <p className="text-lg font-semibold text-navy">{W.hello}</p>
              <p className="mt-1 text-sm text-text-secondary">{W.pickTopic}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUPPORT_TOPICS.map((topic, i) => (
                  <button
                    key={topic}
                    onClick={() => setView({ kind: "thread", id: null, title: topic, topic })}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="animate-[fade-in-up_0.4s_ease-out_both] rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:border-brand/40 hover:bg-brand-light"
                  >
                    {topicName(topic)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border">
              <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
                {W.yourConversations}
              </p>
              {conversations === null ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="px-5 py-4 text-sm text-text-secondary">{W.none}</p>
              ) : (
                <ul>
                  {conversations.slice(0, 20).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setView({ kind: "thread", id: c.id, title: c.productName ?? c.subject })}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-secondary/60"
                      >
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy/5 text-navy">
                          {c.productImage ? (
                            <Image src={c.productImage} alt="" fill sizes="40px" className="object-cover" />
                          ) : c.productId ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className={cn("truncate text-sm", c.unread ? "font-semibold text-navy" : "text-text-primary")}>
                              {c.productName ?? topicName(c.subject)}
                            </span>
                            <span className="shrink-0 text-[11px] text-text-disabled">{timeAgo(c.lastMessageAt)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-text-secondary">
                              {c.lastSender === "customer" ? W.you : ""}
                              {c.lastMessage ?? "—"}
                            </span>
                            {c.unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                                {c.unread}
                              </span>
                            )}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-disabled" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/dashboard/messages"
                onClick={() => setOpen(false)}
                className="block px-5 py-4 text-center text-xs font-medium text-text-secondary hover:text-brand"
              >
                {W.openInbox}
              </Link>
            </div>
          </div>
        ) : (
          <ChatThread
            key={view.id ?? `new-${view.topic}`}
            conversationId={view.id}
            viewer="customer"
            autoFocus
            onCreate={async (text) => {
              const res = await createSupportConversation(view.topic ?? "Something else", text);
              if (!res.success) return { error: res.error };
              const id = res.data!.conversationId;
              setView((v) => (v.kind === "thread" ? { ...v, id } : v));
              return { id };
            }}
            emptyState={
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-navy">{topicName(view.title)}</p>
                <p className="mt-1 text-sm text-text-secondary">{W.tellUs}</p>
              </div>
            }
          />
        )}
      </div>

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? W.close : unreadChats ? format(W.launcherUnread, { n: unreadChats }) : W.launcher}
        className={cn(
          "fixed bottom-5 right-5 z-[66] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_30px_-8px_rgb(214_40_40/0.6)] transition-transform duration-300 hover:scale-105 active:scale-95",
          open && "max-sm:hidden",
          // Product pages have their own "Chat now" and a full-width buy bar on phones.
          pathname?.startsWith("/products/") && "max-sm:hidden",
          unreadChats > 0 && !open && "animate-[launcher-pulse_1.6s_ease-out_infinite]"
        )}
      >
        <span className={cn("transition-transform duration-300", open ? "rotate-90" : "rotate-0")}>
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </span>
        {unreadChats > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 animate-[cart-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center rounded-full bg-navy px-1.5 text-xs font-bold ring-2 ring-white">
            {unreadChats > 9 ? "9+" : unreadChats}
          </span>
        )}
      </button>
    </>
  );
}
