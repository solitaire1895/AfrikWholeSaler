import { MessageCircle, Tag, Clock, Headphones, Bot, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { conversations, messages } from "@/lib/data";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  Low: "bg-surface-secondary text-text-secondary",
  Normal: "bg-info/10 text-info",
  High: "bg-warning/10 text-warning",
  Urgent: "bg-error/10 text-error",
};

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage customer conversations and support tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1 space-y-3">
          {conversations.map((conv) => {
            const convMessages = messages.filter((m) => m.conversationId === conv.id);
            const lastMsg = convMessages[convMessages.length - 1];
            return (
              <Card key={conv.id} hover className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-brand font-semibold text-xs">
                      {conv.customerName[0]}
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{conv.customerName}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {lastMsg && (
                  <p className="text-xs text-text-secondary truncate mb-2">{lastMsg.content}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityColors[conv.priority])}>
                    {conv.priority}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {conv.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-text-disabled">
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Message Thread Preview */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-brand" />
              <h3 className="text-sm font-semibold text-navy">Recent Messages</h3>
            </div>
            <div className="space-y-4">
              {messages.slice(0, 8).map((msg) => {
                const isCustomer = msg.senderRole === "customer";
                const isAI = msg.senderRole === "ai";
                return (
                  <div key={msg.id} className="flex gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isCustomer ? "bg-brand text-white" : isAI ? "bg-navy text-white" : "bg-surface border border-border text-text-secondary"
                    )}>
                      {isCustomer ? <User className="h-4 w-4" /> : isAI ? <Bot className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-text-primary">
                          {isCustomer ? "Customer" : isAI ? "AI Assistant" : "Support Agent"}
                        </span>
                        <span className="text-xs text-text-disabled">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}