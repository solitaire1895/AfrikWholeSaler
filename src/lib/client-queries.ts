import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message, ConversationPriority } from "@/types";

function mapPriority(p: string): ConversationPriority {
  const map: Record<string, ConversationPriority> = {
    low: "Low", normal: "Normal", high: "High", urgent: "Urgent",
  };
  return map[p?.toLowerCase()] ?? "Normal";
}

export function mapMessageRow(row: {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  attachments: string[] | null;
  is_internal_note: boolean;
  created_at: string;
}): Message {
  const role =
    row.sender_type === "agent"
      ? "agent"
      : row.sender_type === "ai_assistant" || row.sender_type === "system"
        ? "ai"
        : "customer";
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id ?? "",
    senderRole: role,
    content: row.content,
    attachments: row.attachments ?? [],
    isInternalNote: row.is_internal_note,
    createdAt: row.created_at,
  };
}

export async function fetchMyConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, customer_id, subject, priority, tags, status, last_message_at, assigned_agent_id, created_at, customers(company_name, contact_name)"
    )
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c: Record<string, unknown>) => {
    const cust = c.customers as { company_name?: string; contact_name?: string } | null;
    return {
      id: c.id as string,
      customerId: (c.customer_id as string) ?? "",
      customerName: cust?.contact_name || cust?.company_name || (c.subject as string) || "Conversation",
      assignedAgentId: (c.assigned_agent_id as string) ?? null,
      priority: mapPriority(c.priority as string),
      tags: (c.tags as string[]) ?? [],
      unreadCount: 0,
      lastMessageAt: (c.last_message_at as string) ?? (c.created_at as string),
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_type, sender_id, content, attachments, is_internal_note, created_at"
    )
    .eq("conversation_id", conversationId)
    .eq("is_internal_note", false)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map(mapMessageRow);
}

export async function fetchAllConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, customer_id, priority, tags, last_message_at, assigned_agent_id, created_at, customers(company_name, contact_name)"
    )
    .order("last_message_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c: Record<string, unknown>) => {
    const cust = c.customers as { company_name?: string; contact_name?: string } | null;
    return {
      id: c.id as string,
      customerId: (c.customer_id as string) ?? "",
      customerName: cust?.contact_name || cust?.company_name || "Customer",
      assignedAgentId: (c.assigned_agent_id as string) ?? null,
      priority: mapPriority(c.priority as string),
      tags: (c.tags as string[]) ?? [],
      unreadCount: 0,
      lastMessageAt: (c.last_message_at as string) ?? (c.created_at as string),
    };
  });
}

export async function fetchRecentMessages(limit = 8): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_type, sender_id, content, attachments, is_internal_note, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapMessageRow).reverse();
}

/**
 * Staff-only: fetch all messages including internal notes
 */
export async function fetchAllMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_type, sender_id, content, attachments, is_internal_note, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map(mapMessageRow);
}

/**
 * Staff-only: fetch all conversations with unread counts
 */
export async function fetchAllConversationsWithUnread(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, customer_id, priority, tags, status, last_message_at, assigned_agent_id, created_at, subject, customers(company_name, contact_name)"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  const result: Conversation[] = [];

  for (const c of data as Array<Record<string, unknown>>) {
    const cust = c.customers as { company_name?: string; contact_name?: string } | null;

    // Get unread count
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", c.id as string)
      .is("read_at", null)
      .neq("sender_type", "agent");

    result.push({
      id: c.id as string,
      customerId: (c.customer_id as string) ?? "",
      customerName: cust?.contact_name || cust?.company_name || (c.subject as string) || "Customer",
      assignedAgentId: (c.assigned_agent_id as string) ?? null,
      priority: mapPriority(c.priority as string),
      tags: (c.tags as string[]) ?? [],
      unreadCount: count || 0,
      lastMessageAt: (c.last_message_at as string) ?? (c.created_at as string),
    });
  }

  return result;
}
