"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Plus, Search, ChevronLeft, Package, Headphones, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import {
  fetchConversationSummaries,
  subscribeToAllMessages,
  previewOf,
  useSupportOnline,
  type ConversationSummary,
} from "@/lib/chat";
import { SUPPORT_TOPICS } from "@/lib/chat-topics";
import { createSupportConversation } from "@/app/actions/chat";
import { ChatThread } from "@/components/chat/chat-thread";
import { useI18n } from "@/i18n/client";

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const { setActiveConversation } = useNotifications();
  const online = useSupportOnline();
  const { t, timeAgo } = useI18n();
  const I = t.chat.inbox;
  const topicName = (topic: string) => (t.chat.topics as Record<string, string>)[topic] ?? topic;
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [newTopic, setNewTopic] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const selectedId = params.get("c");

  const select = useCallback(
    (id: string | null) => {
      setNewTopic(null);
      if (id) setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) ?? prev);
      router.replace(id ? `/dashboard/messages?c=${id}` : "/dashboard/messages", { scroll: false });
    },
    [router]
  );

  const load = useCallback(async () => {
    const list = await fetchConversationSummaries();
    setConversations(list);
    return list;
  }, []);

  // Initial load; open the most recent conversation on wide screens.
  useEffect(() => {
    fetchConversationSummaries().then((list) => {
      setConversations(list);
      if (!params.get("c") && list[0] && window.matchMedia("(min-width: 640px)").matches) select(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Live: bump conversations and unread counts as messages arrive.
  useEffect(() => {
    return subscribeToAllMessages((m) => {
      if (m.isInternalNote) return;
      setConversations((prev) => {
        if (!prev) return prev;
        const conv = prev.find((c) => c.id === m.conversationId);
        if (!conv) {
          load();
          return prev;
        }
        const updated: ConversationSummary = {
          ...conv,
          lastMessage: previewOf(m),
          lastSender: m.senderRole,
          lastMessageAt: m.createdAt,
          unread: m.senderRole !== "customer" && m.conversationId !== selectedId ? conv.unread + 1 : conv.unread,
        };
        return [updated, ...prev.filter((c) => c.id !== conv.id)];
      });
    });
  }, [load, selectedId]);

  // No toasts/sound for the conversation that is open.
  useEffect(() => {
    setActiveConversation(selectedId);
    return () => setActiveConversation(null);
  }, [selectedId, setActiveConversation]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!conversations) return [];
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.subject, c.productName, c.lastMessage].some((v) => v?.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;
  const showThread = !!selected || !!newTopic;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">{I.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            <span className={cn("h-2 w-2 rounded-full", online ? "bg-success" : "bg-text-disabled")} />
            {online ? I.onlineNow : I.replyHours}
          </p>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" /> {I.newConversation}
        </button>
      </div>

      <div className="flex h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {/* Conversation list */}
        <div className={cn("flex w-full shrink-0 flex-col border-r border-border sm:w-80", showThread && "hidden sm:flex")}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={I.search}
                className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm focus:border-navy focus:outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations === null ? (
              [0, 1, 2, 3].map((i) => (
                <li key={i} className="flex gap-3 border-b border-border p-4">
                  <span className="h-10 w-10 animate-pulse rounded-full bg-surface-secondary" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-2/3 animate-pulse rounded bg-surface-secondary" />
                    <span className="block h-3 w-1/2 animate-pulse rounded bg-surface-secondary" />
                  </span>
                </li>
              ))
            ) : filtered.length === 0 ? (
              <li className="p-8 text-center">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-text-disabled" />
                <p className="text-sm text-text-secondary">
                  {search ? I.noMatch : I.none}
                </p>
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => select(c.id)}
                    className={cn(
                      "flex w-full gap-3 border-b border-border p-4 text-left transition-colors",
                      c.id === selectedId ? "bg-brand-light" : "hover:bg-surface-secondary/60"
                    )}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy/5 text-navy">
                      {c.productImage ? (
                        <Image src={c.productImage} alt="" fill sizes="40px" className="object-cover" />
                      ) : c.productId ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Headphones className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "font-semibold text-navy" : "font-medium text-text-primary")}>
                          {c.productName ?? topicName(c.subject)}
                        </span>
                        <span className="shrink-0 text-[11px] text-text-disabled">{timeAgo(c.lastMessageAt)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-text-secondary">
                          {c.lastSender === "customer" ? I.you : ""}
                          {c.lastMessage ?? "—"}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Thread */}
        {showThread ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                onClick={() => select(null)}
                aria-label={I.backToList}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary sm:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">
                  {selected?.productName ?? topicName(selected?.subject ?? newTopic ?? "")}
                </p>
                <p className="text-xs text-text-secondary">
                  {selected?.productSlug ? (
                    <Link href={`/products/${selected.productSlug}`} className="hover:text-brand">
                      {I.viewProduct}
                    </Link>
                  ) : (
                    I.support
                  )}
                </p>
              </div>
            </div>
            <ChatThread
              key={selectedId ?? `new-${newTopic}`}
              conversationId={selectedId}
              viewer="customer"
              autoFocus
              onCreate={async (text) => {
                const res = await createSupportConversation(newTopic ?? "Something else", text);
                if (!res.success) return { error: res.error };
                const id = res.data!.conversationId;
                await load();
                select(id);
                return { id };
              }}
              emptyState={
                <div className="py-10 text-center">
                  <p className="font-medium text-navy">{topicName(newTopic ?? "")}</p>
                  <p className="mt-1 text-sm text-text-secondary">{I.tellUs}</p>
                </div>
              }
            />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary">
                <MessageCircle className="h-8 w-8 text-text-disabled" />
              </span>
              <h3 className="text-lg font-semibold text-navy">{I.selectTitle}</h3>
              <p className="mt-1 text-sm text-text-secondary">{I.selectText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Topic picker */}
      {picking && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-4 sm:items-center" onClick={() => setPicking(false)}>
          <div
            role="dialog"
            aria-label={I.pickerLabel}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-[scale-in_0.2s_ease-out] rounded-[24px] bg-surface p-6 shadow-[var(--shadow-modal)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">{I.pickerTitle}</h2>
              <button onClick={() => setPicking(false)} aria-label={I.close} className="rounded-full p-1 hover:bg-surface-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {SUPPORT_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setPicking(false);
                    router.replace("/dashboard/messages", { scroll: false });
                    setNewTopic(topic);
                  }}
                  className="rounded-2xl border border-border px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:border-brand/40 hover:bg-brand-light"
                >
                  {topicName(topic)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}
