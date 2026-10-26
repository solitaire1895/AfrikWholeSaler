"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Search,
  UserCheck,
  Flag,
  CheckCheck,
  Inbox,
  X,
  ChevronLeft,
  Package,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import {
  fetchConversationSummaries,
  subscribeToAllMessages,
  previewOf,
  type ConversationSummary,
} from "@/lib/chat";
import { updateConversationStatus, updateConversationPriority } from "@/app/actions/crud";
import { assignConversationToMe } from "@/app/actions/chat";
import { ChatThread } from "@/components/chat/chat-thread";
import { useI18n } from "@/i18n/client";

const priorityColors: Record<string, string> = {
  low: "bg-surface-secondary text-text-secondary",
  normal: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-error/10 text-error",
};


type Filter = "all" | "unread" | "mine" | "unassigned" | "resolved";

function StaffInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const { userId, setActiveConversation } = useNotifications();
  const { t, format, timeAgo } = useI18n();
  const M = t.chat.staff;
  const topicName = (topic: string) => (t.chat.topics as Record<string, string>)[topic] ?? topic;
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedId = params.get("c");

  const select = useCallback(
    (id: string | null) => {
      if (id) setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) ?? prev);
      router.replace(id ? `/admin/messages?c=${id}` : "/admin/messages", { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    fetchConversationSummaries().then((list) => {
      setConversations(list);
      if (!params.get("c") && list[0] && window.matchMedia("(min-width: 640px)").matches) select(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Live list: new messages bump their conversation; unknown ones trigger a reload.
  useEffect(() => {
    return subscribeToAllMessages((m) => {
      setConversations((prev) => {
        if (!prev) return prev;
        const conv = prev.find((c) => c.id === m.conversationId);
        if (!conv) {
          fetchConversationSummaries().then(setConversations);
          return prev;
        }
        const fromCustomer = m.senderRole === "customer";
        const updated: ConversationSummary = {
          ...conv,
          lastMessage: m.isInternalNote ? conv.lastMessage : previewOf(m),
          lastSender: m.isInternalNote ? conv.lastSender : m.senderRole,
          lastMessageAt: m.createdAt,
          status: fromCustomer && (conv.status === "resolved" || conv.status === "closed") ? "open" : conv.status,
          unread: fromCustomer && m.conversationId !== selectedId ? conv.unread + 1 : conv.unread,
        };
        return [updated, ...prev.filter((c) => c.id !== conv.id)];
      });
    });
  }, [selectedId]);

  useEffect(() => {
    setActiveConversation(selectedId);
    return () => setActiveConversation(null);
  }, [selectedId, setActiveConversation]);

  const patch = (id: string, changes: Partial<ConversationSummary>) =>
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, ...changes } : c)) ?? prev);

  function run(action: () => Promise<{ success: boolean; error?: string }>, onOk: () => void) {
    startTransition(async () => {
      const res = await action();
      if (!res.success) setError(res.error || M.error);
      else onOk();
    });
  }

  const counts = useMemo(() => {
    const list = conversations ?? [];
    return {
      all: list.filter((c) => c.status !== "resolved" && c.status !== "closed").length,
      unread: list.filter((c) => c.unread > 0).length,
      mine: list.filter((c) => c.assignedAgentId === userId).length,
      unassigned: list.filter((c) => !c.assignedAgentId && c.status !== "resolved" && c.status !== "closed").length,
      resolved: list.filter((c) => c.status === "resolved" || c.status === "closed").length,
    };
  }, [conversations, userId]);

  const filtered = useMemo(() => {
    let list = conversations ?? [];
    if (filter === "all") list = list.filter((c) => c.status !== "resolved" && c.status !== "closed");
    if (filter === "unread") list = list.filter((c) => c.unread > 0);
    if (filter === "mine") list = list.filter((c) => c.assignedAgentId === userId);
    if (filter === "unassigned") list = list.filter((c) => !c.assignedAgentId && c.status !== "resolved" && c.status !== "closed");
    if (filter === "resolved") list = list.filter((c) => c.status === "resolved" || c.status === "closed");
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter((c) =>
        [c.customerName, c.subject, c.productName, c.lastMessage, ...c.tags].some((v) => v?.toLowerCase().includes(q))
      );
    return list;
  }, [conversations, filter, search, userId]);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;
  const totalUnread = (conversations ?? []).reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">{M.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{M.lead}</p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5">
            <Inbox className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-brand">{format(M.unread, { n: totalUnread })}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label={t.common.dismiss}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {/* List */}
        <div className={cn("flex w-full shrink-0 flex-col border-r border-border sm:w-[340px]", selected && "hidden sm:flex")}>
          <div className="space-y-3 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={M.search}
                className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm focus:border-navy focus:outline-none"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(["all", "unread", "mine", "unassigned", "resolved"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    filter === f ? "bg-navy text-white" : "bg-surface-secondary text-text-secondary hover:text-navy"
                  )}
                >
                  {{ all: M.filterAll, unread: M.filterUnread, mine: M.filterMine, unassigned: M.filterUnassigned, resolved: M.filterResolved }[f]}
                  <span className={cn("text-[10px]", filter === f ? "text-white/70" : "text-text-disabled")}>{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {conversations === null ? (
              [0, 1, 2, 3, 4].map((i) => (
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
                <p className="text-sm text-text-secondary">{M.empty}</p>
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
                      {c.customerName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "font-semibold text-navy" : "font-medium text-text-primary")}>
                          {c.customerName}
                        </span>
                        <span className="shrink-0 text-[11px] text-text-disabled">{timeAgo(c.lastMessageAt)}</span>
                      </span>
                      <span className="block truncate text-xs text-text-secondary">{c.productName ?? topicName(c.subject)}</span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", c.unread ? "text-text-primary" : "text-text-disabled")}>
                          {c.lastSender && c.lastSender !== "customer" ? M.you : ""}
                          {c.lastMessage ?? "—"}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", priorityColors[c.priority])}>
                          {(M.priorities as Record<string, string>)[c.priority] ?? c.priority}
                        </span>
                        {c.assignedAgentId && (
                          <span className="flex items-center gap-0.5 text-[10px] text-success">
                            <UserCheck className="h-3 w-3" />
                            {c.assignedAgentId === userId ? M.assignedYou : M.assigned}
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
        {selected ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => select(null)}
                  aria-label={M.back}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary sm:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand">
                  {selected.customerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{selected.customerName}</p>
                  <p className="truncate text-xs text-text-secondary">{topicName(selected.subject)}</p>
                </div>
                {selected.productSlug && (
                  <Link
                    href={`/products/${selected.productSlug}`}
                    target="_blank"
                    className="hidden items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-xs text-text-primary hover:border-navy/30 md:flex"
                  >
                    <span className="relative h-7 w-7 overflow-hidden rounded-full bg-surface-secondary">
                      {selected.productImage ? (
                        <Image src={selected.productImage} alt="" fill sizes="28px" className="object-cover" />
                      ) : (
                        <Package className="m-1.5 h-4 w-4 text-text-disabled" />
                      )}
                    </span>
                    <span className="max-w-[160px] truncate">{selected.productName}</span>
                    <ExternalLink className="h-3 w-3 text-text-disabled" />
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5 text-text-disabled" />
                  <select
                    value={selected.priority}
                    disabled={isPending}
                    onChange={(e) => {
                      const v = e.target.value;
                      run(() => updateConversationPriority(selected.id, v), () => patch(selected.id, { priority: v }));
                    }}
                    aria-label={M.priority}
                    className="h-8 cursor-pointer rounded-full border border-border bg-surface px-3 text-xs font-medium focus:border-navy focus:outline-none disabled:opacity-50"
                  >
                    {["low", "normal", "high", "urgent"].map((p) => (
                      <option key={p} value={p}>
                        {(M.priorities as Record<string, string>)[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-text-disabled" />
                  <select
                    value={selected.status}
                    disabled={isPending}
                    onChange={(e) => {
                      const v = e.target.value;
                      run(() => updateConversationStatus(selected.id, v), () => patch(selected.id, { status: v }));
                    }}
                    aria-label={M.status}
                    className="h-8 cursor-pointer rounded-full border border-border bg-surface px-3 text-xs font-medium focus:border-navy focus:outline-none disabled:opacity-50"
                  >
                    {Object.entries(M.statuses).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {selected.assignedAgentId === userId ? (
                  <button
                    disabled={isPending}
                    onClick={() =>
                      run(() => assignConversationToMe(selected.id, true), () => patch(selected.id, { assignedAgentId: null }))
                    }
                    className="flex h-8 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 text-xs font-medium text-success disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> {M.releaseMine}
                  </button>
                ) : (
                  <button
                    disabled={isPending}
                    onClick={() =>
                      run(() => assignConversationToMe(selected.id), () => patch(selected.id, { assignedAgentId: userId }))
                    }
                    className="flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    {selected.assignedAgentId ? M.takeOver : M.assignMe}
                  </button>
                )}
                {selected.status !== "resolved" && (
                  <button
                    disabled={isPending}
                    onClick={() =>
                      run(() => updateConversationStatus(selected.id, "resolved"), () => patch(selected.id, { status: "resolved" }))
                    }
                    className="ml-auto flex h-8 items-center gap-1 rounded-full bg-navy px-3 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> {M.markResolved}
                  </button>
                )}
              </div>
            </div>

            <ChatThread
              key={selected.id}
              conversationId={selected.id}
              viewer="staff"
              allowInternalNotes
              autoFocus
              placeholder={M.replyPlaceholder}
            />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary">
                <MessageCircle className="h-8 w-8 text-text-disabled" />
              </span>
              <h3 className="text-lg font-semibold text-navy">{M.selectTitle}</h3>
              <p className="mt-1 text-sm text-text-secondary">{M.selectText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <StaffInbox />
    </Suspense>
  );
}
