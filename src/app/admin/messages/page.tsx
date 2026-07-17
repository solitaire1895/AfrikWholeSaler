"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  Search,
  Tag,
  Bot,
  User,
  Headphones,
  X,
  Lock,
  UserCheck,
  Flag,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  fetchAllConversationsWithUnread,
  fetchAllMessages,
  mapMessageRow,
} from "@/lib/client-queries";
import {
  sendMessage,
  markMessagesRead,
  assignConversation,
  updateConversationStatus,
  updateConversationPriority,
  uploadFile,
} from "@/app/actions/crud";
import { subscribeToMessages } from "@/lib/realtime";
import type { Message, Conversation } from "@/types";

const priorityColors: Record<string, string> = {
  Low: "bg-surface-secondary text-text-secondary",
  Normal: "bg-info/10 text-info",
  High: "bg-warning/10 text-warning",
  Urgent: "bg-error/10 text-error",
};

const statusColors: Record<string, string> = {
  open: "bg-success/10 text-success",
  pending_agent: "bg-warning/10 text-warning",
  resolved: "bg-info/10 text-info",
  closed: "bg-surface-secondary text-text-secondary",
};

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const selectedMessages = chatMessages[selectedConvId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  useEffect(() => {
    fetchAllConversationsWithUnread().then((convs) => {
      setConversations(convs);
      if (convs[0]) setSelectedConvId(convs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;
    let active = true;

    fetchAllMessages(selectedConvId).then((msgs) => {
      if (active) setChatMessages((prev) => ({ ...prev, [selectedConvId]: msgs }));
    });
    markMessagesRead(selectedConvId);

    const unsubscribe = subscribeToMessages(selectedConvId, (row) => {
      const msg = mapMessageRow(row as Parameters<typeof mapMessageRow>[0]);
      setChatMessages((prev) => {
        const existing = prev[selectedConvId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [selectedConvId]: [...existing, msg] };
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [selectedConvId]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConvId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const result = await sendMessage({
      conversationId: selectedConvId,
      content,
      isInternalNote,
    });
    setSending(false);
    if (!result.success) {
      setInput(content);
      setError(result.error || "Failed to send message");
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedConvId) return;
    const file = files[0];

    setIsUploading(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop() || "file";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `chat-attachments/${fileName}`;

      const result = await uploadFile("chat-attachments", filePath, file);

      if (result.success && result.data) {
        const url = (result.data as { url: string }).url;
        const attachmentMsg = await sendMessage({
          conversationId: selectedConvId,
          content: `📎 ${file.name}`,
          attachments: [url],
          isInternalNote,
        });

        if (!attachmentMsg.success) {
          setError(attachmentMsg.error || "Failed to send attachment");
        }
      } else {
        setError(result.error || "Failed to upload file");
      }
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  function handleAssign(convId: string, agentId: string | null) {
    startTransition(async () => {
      const result = await assignConversation(convId, agentId);
      if (!result.success) {
        setError(result.error || "Failed to assign conversation");
      } else {
        // Update local state
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, assignedAgentId: agentId } : c
          )
        );
      }
    });
  }

  function handleStatusChange(convId: string, status: string) {
    startTransition(async () => {
      const result = await updateConversationStatus(convId, status);
      if (!result.success) {
        setError(result.error || "Failed to update status");
      }
    });
  }

  function handlePriorityChange(convId: string, priority: string) {
    startTransition(async () => {
      const result = await updateConversationPriority(convId, priority);
      if (!result.success) {
        setError(result.error || "Failed to update priority");
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, priority: priority.charAt(0).toUpperCase() + priority.slice(1) as Conversation["priority"] }
              : c
          )
        );
      }
    });
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(query) ||
      c.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage customer conversations, assign agents, and track support tickets.
          </p>
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-brand/10 px-3 py-1.5">
            <Inbox className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-brand">{totalUnread} unread</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error/70 hover:text-error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Chat Layout */}
      <div className="flex h-[calc(100vh-14rem)] rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
        {/* Conversation List */}
        <div
          className={cn(
            "w-full sm:w-80 shrink-0 border-r border-border flex flex-col",
            selectedConvId && "hidden sm:flex"
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const convMessages = chatMessages[conv.id] || [];
                const lastMsg = convMessages[convMessages.length - 1];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      "w-full flex flex-col items-start p-4 border-b border-border text-left transition-colors",
                      selectedConvId === conv.id
                        ? "bg-brand-light"
                        : "hover:bg-surface-secondary/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-brand font-semibold text-xs">
                          {conv.customerName[0]}
                        </div>
                        <span className="text-sm font-semibold text-text-primary">
                          {conv.customerName}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-text-secondary truncate w-full mb-2">
                        {lastMsg.senderRole === "agent" ? "Agent: " : lastMsg.senderRole === "ai" ? "AI: " : ""}
                        {lastMsg.isInternalNote && "🔒 "}
                        {lastMsg.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          priorityColors[conv.priority]
                        )}
                      >
                        {conv.priority}
                      </span>
                      {conv.assignedAgentId && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-success">
                          <UserCheck className="h-2.5 w-2.5" />
                          Assigned
                        </span>
                      )}
                      <span className="text-xs text-text-disabled ml-auto">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <MessageCircle className="h-8 w-8 text-text-disabled mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No conversations found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Thread */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header with Controls */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvId("")}
                    className="sm:hidden flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
                  >
                    ←
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand font-semibold text-sm">
                    {selectedConv.customerName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {selectedConv.customerName}
                    </p>
                    <div className="flex items-center gap-2">
                      {selectedConv.assignedAgentId ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-success">
                          <UserCheck className="h-3 w-3" />
                          Agent assigned
                        </span>
                      ) : (
                        <span className="text-xs text-text-secondary">Awaiting agent</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority Selector */}
                <div className="flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5 text-text-disabled" />
                  <select
                    value={selectedConv.priority.toLowerCase()}
                    onChange={(e) => handlePriorityChange(selectedConv.id, e.target.value)}
                    disabled={isPending}
                    className="h-7 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs font-medium focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-text-disabled" />
                  <select
                    value="open"
                    onChange={(e) => handleStatusChange(selectedConv.id, e.target.value)}
                    disabled={isPending}
                    className="h-7 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs font-medium focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="pending_agent">Pending Agent</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Assign to me */}
                <button
                  onClick={() => handleAssign(selectedConv.id, null)}
                  disabled={isPending}
                  className="flex h-7 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 text-xs font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-50"
                >
                  <UserCheck className="h-3 w-3" />
                  {selectedConv.assignedAgentId ? "Reassign" : "Assign to me"}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
              {selectedMessages.length > 0 ? (
                selectedMessages.map((msg) => {
                  const isAgent = msg.senderRole === "agent";
                  const isAI = msg.senderRole === "ai";
                  const isInternal = msg.isInternalNote;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        isAgent && !isInternal ? "flex-row" : "flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isAgent && !isInternal
                            ? "bg-surface border border-border text-text-secondary"
                            : isAI
                              ? "bg-navy text-white"
                              : "bg-brand text-white"
                        )}
                      >
                        {isAgent && !isInternal ? (
                          <Headphones className="h-4 w-4" />
                        ) : isAI ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[75%] sm:max-w-[60%]",
                          isAgent && !isInternal ? "items-start" : "items-end"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-text-primary">
                            {isAgent && !isInternal
                              ? "Support Agent"
                              : isAI
                                ? "AI Assistant"
                                : "Customer"}
                          </span>
                          {isInternal && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                              <Lock className="h-2.5 w-2.5" />
                              Internal
                            </span>
                          )}
                          <span className="text-xs text-text-disabled">
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-[var(--radius-md)] px-4 py-2.5 text-sm",
                            isInternal
                              ? "bg-warning/10 border border-warning/20 text-text-primary rounded-tl-sm"
                              : isAgent
                                ? "bg-surface border border-border text-text-primary rounded-tl-sm"
                                : isAI
                                  ? "bg-navy text-white rounded-tr-sm"
                                  : "bg-brand text-white rounded-tr-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                        {msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att) => (
                              <a
                                key={att}
                                href={att}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors",
                                  isAgent
                                    ? "bg-surface border border-border text-text-secondary hover:bg-surface-secondary"
                                    : "bg-brand/10 text-brand hover:bg-brand/20"
                                )}
                              >
                                <Paperclip className="h-3 w-3" />
                                {att.split("/").pop() || "Attachment"}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-text-disabled mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">No messages yet. Start the conversation.</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-surface space-y-2">
              {/* Internal Note Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors",
                    isInternalNote
                      ? "bg-warning/10 text-warning border border-warning/20"
                      : "text-text-secondary hover:bg-surface-secondary border border-border"
                  )}
                >
                  <Lock className="h-3 w-3" />
                  {isInternalNote ? "Internal note (hidden from customer)" : "Toggle internal note"}
                </button>
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder={isInternalNote ? "Type an internal note..." : "Type your reply..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className={cn(
                    "flex-1 h-10 rounded-[var(--radius-input)] border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none transition-all",
                    isInternalNote
                      ? "border-warning/30 focus:border-warning focus:ring-2 focus:ring-warning/20"
                      : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || isUploading}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
                    isInternalNote ? "bg-warning hover:bg-warning/90" : "bg-brand hover:bg-brand-hover"
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              {isUploading && (
                <p className="text-xs text-text-disabled">Uploading file...</p>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-text-disabled" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-1">
                Select a conversation
              </h3>
              <p className="text-text-secondary text-sm">
                Choose a conversation from the list to view messages and respond.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}