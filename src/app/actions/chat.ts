"use server";

import { rateLimit } from "@/lib/rate-limit";
import { te } from "@/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/queries";
import { sendMessage } from "@/app/actions/crud";
import { SUPPORT_TOPICS } from "@/lib/chat-topics";

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

/**
 * Starts a new support conversation for the logged-in customer and sends
 * their first message (and attachments, if any).
 */
export async function createSupportConversation(
  topic: string,
  content: string,
  attachments: string[] = []
): Promise<Result<{ conversationId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: await te("Please log in to chat with us.") };
  if (!(await rateLimit(`conv:${user.id}`, 10, 3600))) return { success: false, error: await te("Too many requests. Please wait a moment and try again.") };

  const text = content.trim();
  if (!text && attachments.length === 0) return { success: false, error: await te("Message is empty.") };
  if (text.length > 4000) return { success: false, error: await te("Message is too long.") };

  const customer = await getCurrentCustomer();
  if (!customer) return { success: false, error: await te("We couldn't find your customer profile.") };

  const subject = (SUPPORT_TOPICS as readonly string[]).includes(topic) ? topic : "Support";

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      customer_id: customer.id,
      user_id: user.id,
      subject,
      tags: [subject.toLowerCase().replace(/[^a-z]+/g, "-")],
      priority: "normal",
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? (await te("Could not start the conversation.")) };

  const sent = await sendMessage({ conversationId: data.id, content: text, attachments });
  if (!sent.success) return { success: false, error: sent.error ?? (await te("Message not sent.")) };

  return { success: true, data: { conversationId: data.id } };
}

/** Staff: take ownership of a conversation (or release it with null). */
export async function assignConversationToMe(conversationId: string, release = false): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: await te("Unauthorized") };

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_agent_id: release ? null : user.id })
    .eq("id", conversationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
