"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  Sparkles,
  Search,
  Tag,
  Clock,
  Bot,
  User,
  Headphones,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { conversations, messages as initialMessages } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

const priorityColors: Record<string, string> = {
  Low: "bg-surface-secondary text-text-secondary",
  Normal: "bg-info/10 text-info",
  High: "bg-warning/10 text-warning",
  Urgent: "bg-error/10 text-error",
};

export default function MessagesPage() {
  const [selectedConvId, setSelectedConvId] = useState(conversations[0]?.id || "");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(
    () => {
      const grouped: Record<string, Message[]> = {};
      for (const msg of initialMessages) {
        if (!grouped[msg.conversationId]) grouped[msg.conversationId] = [];
        grouped[msg.conversationId].push(msg);
      }
      return grouped;
    }
  );
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const selectedMessages = chatMessages[selectedConvId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const handleSend = () => {
    if (!input.trim() || !selectedConvId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: "cust-1",
      senderRole: "customer",
      content: input.trim(),
      attachments: [],
      isInternalNote: false,
      createdAt: new Date().toISOString(),
    };

    setChatMessages({
      ...chatMessages,
      [selectedConvId]: [...selectedMessages, newMessage],
    });
    setInput("");
  };

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Chat with our team about orders, quotes, and product inquiries.
        </p>
      </div>

      {/* Chat Layout */}
      <div className="flex h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
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
            {filteredConversations.map((conv) => {
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
                      {lastMsg.senderRole === "customer" ? "You: " : ""}
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
                    <div className="flex items-center gap-1 flex-wrap">
                      {conv.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-xs text-text-disabled"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-text-disabled ml-auto">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Thread */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
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
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        priorityColors[selectedConv.priority]
                      )}
                    >
                      {selectedConv.priority}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {selectedConv.assignedAgentId
                        ? "Agent assigned"
                        : "Awaiting agent"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-success">
                <div className="h-2 w-2 rounded-full bg-success" />
                Online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary/30">
              {selectedMessages.map((msg) => {
                const isCustomer = msg.senderRole === "customer";
                const isAI = msg.senderRole === "ai";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isCustomer ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        isCustomer
                          ? "bg-brand text-white"
                          : isAI
                            ? "bg-navy text-white"
                            : "bg-surface border border-border text-text-secondary"
                      )}
                    >
                      {isCustomer ? (
                        <User className="h-4 w-4" />
                      ) : isAI ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <Headphones className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "max-w-[75%] sm:max-w-[60%]",
                        isCustomer ? "items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-text-primary">
                          {isCustomer
                            ? "You"
                            : isAI
                              ? "AI Assistant"
                              : "Support Agent"}
                        </span>
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
                          isCustomer
                            ? "bg-brand text-white rounded-tr-sm"
                            : isAI
                              ? "bg-navy text-white rounded-tl-sm"
                              : "bg-surface border border-border text-text-primary rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs",
                                isCustomer
                                  ? "bg-brand/10 text-brand"
                                  : "bg-surface border border-border text-text-secondary"
                              )}
                            >
                              <Paperclip className="h-3 w-3" />
                              {att}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-surface">
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary transition-colors">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-white hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-text-disabled">
                <Sparkles className="h-3 w-3" />
                <span>AI assistant may respond first for quick inquiries</span>
              </div>
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
                Choose a conversation from the list to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}