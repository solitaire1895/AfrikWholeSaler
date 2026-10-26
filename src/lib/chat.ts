"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { mapMessageRow } from "@/lib/client-queries";
import type { Message } from "@/types";

// ========================================================
// Chat data & realtime helpers shared by the customer widget,
// the customer inbox, the product chat and the staff inbox.
// ========================================================

export type MessageRow = Parameters<typeof mapMessageRow>[0];

const MESSAGE_COLUMNS =
  "id, conversation_id, sender_type, sender_id, content, attachments, is_internal_note, created_at, read_at";

export interface ConversationSummary {
  id: string;
  subject: string;
  status: string;
  priority: string;
  tags: string[];
  customerId: string;
  customerName: string;
  userId: string | null;
  assignedAgentId: string | null;
  productId: string | null;
  productName: string | null;
  productSlug: string | null;
  productImage: string | null;
  lastMessageAt: string;
  lastMessage: string | null;
  lastSender: string | null;
  unread: number;
}

/** Conversations visible to the caller (RLS: own for customers, all for staff), newest first. */
export async function fetchConversationSummaries(): Promise<ConversationSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, subject, status, priority, tags, customer_id, user_id, assigned_agent_id, product_id, last_message_at, created_at, customers(company_name, contact_name), products(name, slug, images)"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);

  // Before cart_orders.sql adds conversations.product_id, retry without it.
  let rows = data as Array<Record<string, unknown>> | null;
  if (error) {
    const fallback = await supabase
      .from("conversations")
      .select(
        "id, subject, status, priority, tags, customer_id, user_id, assigned_agent_id, last_message_at, created_at, customers(company_name, contact_name)"
      )
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(200);
    rows = fallback.data as Array<Record<string, unknown>> | null;
  }
  if (!rows) return [];

  const ids = rows.map((r) => r.id as string);
  const [latest, unread] = await Promise.all([fetchLatestMessages(ids), fetchUnreadCounts()]);

  return rows.map((c) => {
    const cust = c.customers as { company_name?: string; contact_name?: string } | null;
    const prod = c.products as { name?: string; slug?: string; images?: string[] } | null;
    const last = latest.get(c.id as string);
    return {
      id: c.id as string,
      subject: (c.subject as string) || "Conversation",
      status: (c.status as string) || "open",
      priority: (c.priority as string) || "normal",
      tags: (c.tags as string[]) ?? [],
      customerId: (c.customer_id as string) ?? "",
      customerName: cust?.contact_name || cust?.company_name || "Customer",
      userId: (c.user_id as string) ?? null,
      assignedAgentId: (c.assigned_agent_id as string) ?? null,
      productId: (c.product_id as string) ?? null,
      productName: prod?.name ?? null,
      productSlug: prod?.slug ?? null,
      productImage: prod?.images?.[0] ?? null,
      lastMessageAt: (c.last_message_at as string) ?? (c.created_at as string),
      lastMessage: last ? previewOf(last) : null,
      lastSender: last?.senderRole ?? null,
      unread: unread[c.id as string] ?? 0,
    };
  });
}

/** Latest message for each conversation, in one query. */
async function fetchLatestMessages(conversationIds: string[]): Promise<Map<string, Message>> {
  const map = new Map<string, Message>();
  if (conversationIds.length === 0) return map;
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .in("conversation_id", conversationIds)
    .eq("is_internal_note", false)
    .order("created_at", { ascending: false })
    .limit(Math.min(1000, conversationIds.length * 5));
  for (const row of (data ?? []) as MessageRow[]) {
    if (!map.has(row.conversation_id)) map.set(row.conversation_id, mapMessageRow(row));
  }
  return map;
}

export function previewOf(m: Pick<Message, "content" | "attachments">) {
  if (m.content?.trim()) return m.content;
  return m.attachments.length ? "📎 Attachment" : "";
}

export async function fetchThread(conversationId: string, includeInternal: boolean): Promise<Message[]> {
  const supabase = createClient();
  let query = supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (!includeInternal) query = query.eq("is_internal_note", false);
  const { data } = await query;
  return ((data ?? []) as MessageRow[]).map(mapMessageRow);
}

/** Unread messages per conversation for the current user. */
export async function fetchUnreadCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("chat_unread_counts");
  if (error || !data) return {};
  const out: Record<string, number> = {};
  for (const row of data as { conversation_id: string; unread: number }[]) out[row.conversation_id] = Number(row.unread);
  return out;
}

/** Marks the other side's messages read and clears the chat notification. */
export async function markConversationRead(conversationId: string) {
  const supabase = createClient();
  await supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
}

// ========================================================
// Realtime: messages (insert + read receipts), typing, presence
// ========================================================

export function subscribeToThread(
  conversationId: string,
  handlers: { onInsert: (m: Message) => void; onUpdate: (m: Message) => void }
): () => void {
  const supabase = createClient();
  const filter = `conversation_id=eq.${conversationId}`;
  const channel = supabase
    .channel(`thread:${conversationId}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, (p) =>
      handlers.onInsert(mapMessageRow(p.new as MessageRow))
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter }, (p) =>
      handlers.onUpdate(mapMessageRow(p.new as MessageRow))
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Every new message the caller can see (staff inbox / customer widget list). */
export function subscribeToAllMessages(onInsert: (m: Message) => void): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`all-messages:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) =>
      onInsert(mapMessageRow(p.new as MessageRow))
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * "Typing…" signals over a broadcast channel (nothing is stored).
 * Returns a sender throttled to one event every 2 seconds.
 */
// Typing channels must share a topic per conversation (that's how both sides
// hear each other), and the client reuses channels by topic — so keep one
// channel per conversation and fan its events out to every listener.
const typingChannels = new Map<
  string,
  { channel: RealtimeChannel; listeners: Set<(role: string) => void> }
>();

export function joinTypingChannel(
  conversationId: string,
  role: "customer" | "staff",
  onOtherTyping: () => void
): { sendTyping: () => void; leave: () => void } {
  let entry = typingChannels.get(conversationId);
  if (!entry) {
    const listeners = new Set<(role: string) => void>();
    const channel = createClient()
      .channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        listeners.forEach((listener) => listener(payload?.role));
      });
    channel.subscribe();
    entry = { channel, listeners };
    typingChannels.set(conversationId, entry);
  }

  const shared = entry;
  const listener = (from: string) => {
    if (from !== role) onOtherTyping();
  };
  shared.listeners.add(listener);
  let last = 0;

  return {
    sendTyping() {
      const now = Date.now();
      if (now - last < 2000) return;
      last = now;
      shared.channel.send({ type: "broadcast", event: "typing", payload: { role } });
    },
    leave() {
      shared.listeners.delete(listener);
      if (shared.listeners.size === 0 && typingChannels.get(conversationId) === shared) {
        typingChannels.delete(conversationId);
        createClient().removeChannel(shared.channel);
      }
    },
  };
}

const PRESENCE_CHANNEL = "support-presence";

// The Supabase browser client reuses channels by name, so the whole tab
// shares ONE presence channel: callbacks are attached once, before
// subscribe(), and every user of it is reference-counted.
interface SharedPresence {
  channel: RealtimeChannel;
  refs: number;
  online: boolean;
  listeners: Set<(online: boolean) => void>;
  ready: Promise<void>;
}

let sharedPresence: SharedPresence | null = null;

function acquirePresence(): SharedPresence {
  if (!sharedPresence) {
    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    });
    const shared: SharedPresence = {
      channel,
      refs: 0,
      online: false,
      listeners: new Set(),
      ready: Promise.resolve(),
    };
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ role: string }>();
      shared.online = Object.values(state).some((metas) => metas.some((m) => m.role === "staff"));
      shared.listeners.forEach((listener) => listener(shared.online));
    });
    shared.ready = new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
      });
    });
    sharedPresence = shared;
  }
  sharedPresence.refs++;
  return sharedPresence;
}

function releasePresence(shared: SharedPresence) {
  shared.refs--;
  if (shared.refs <= 0 && sharedPresence === shared) {
    sharedPresence = null;
    createClient().removeChannel(shared.channel);
  }
}

/** Staff announce themselves while the site is open; customers see "online". */
export function trackStaffPresence(userId: string): () => void {
  const shared = acquirePresence();
  let active = true;
  shared.ready.then(() => {
    if (active) shared.channel.track({ role: "staff", userId, at: new Date().toISOString() });
  });
  return () => {
    active = false;
    shared.channel.untrack();
    releasePresence(shared);
  };
}

/** True while at least one staff member is online. */
export function useSupportOnline(enabled = true): boolean {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const shared = acquirePresence();
    shared.listeners.add(setOnline);
    // Pick up the current state if the channel was already synced.
    queueMicrotask(() => setOnline(shared.online));
    return () => {
      shared.listeners.delete(setOnline);
      releasePresence(shared);
    };
  }, [enabled]);
  return online;
}

// ========================================================
// Attachments — private bucket, files stored under <conversation_id>/
// Messages keep "storage://chat-attachments/<path>"; the UI swaps it for a
// short-lived signed URL.
// ========================================================

const BUCKET = "chat-attachments";
const PREFIX = `storage://${BUCKET}/`;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";

export async function uploadChatAttachment(conversationId: string, file: File): Promise<string> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
  const supabase = createClient();
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return PREFIX + path;
}

const signedCache = new Map<string, { url: string; expires: number }>();

export async function resolveAttachmentUrl(ref: string): Promise<string> {
  if (!ref.startsWith(PREFIX)) return ref; // older public URLs
  const cached = signedCache.get(ref);
  if (cached && cached.expires > Date.now()) return cached.url;
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(ref.slice(PREFIX.length), 3600);
  const url = data?.signedUrl ?? "";
  if (url) signedCache.set(ref, { url, expires: Date.now() + 55 * 60 * 1000 });
  return url;
}

export function attachmentName(ref: string) {
  const last = decodeURIComponent(ref.split("?")[0].split("/").pop() || "file");
  return last.replace(/^\d{10,}-[a-z0-9]{6}-/, "");
}

export function isImageAttachment(ref: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(ref.split("?")[0]);
}
