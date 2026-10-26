"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Send,
  Paperclip,
  Loader2,
  X,
  Check,
  CheckCheck,
  Lock,
  FileText,
  RotateCcw,
  ArrowDown,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/app/actions/crud";
import {
  fetchThread,
  subscribeToThread,
  joinTypingChannel,
  markConversationRead,
  uploadChatAttachment,
  resolveAttachmentUrl,
  attachmentName,
  isImageAttachment,
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/chat";
import type { Message } from "@/types";
import { useI18n } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionary";

type Viewer = "customer" | "staff";

/** A message as shown in the thread, including ones still being sent. */
interface UiMessage extends Message {
  status?: "sending" | "failed";
  localFiles?: File[];
}

// ---------- Attachments ----------

function Attachment({ refUrl, mine }: { refUrl: string; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    resolveAttachmentUrl(refUrl).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [refUrl]);

  const name = attachmentName(refUrl);
  if (isImageAttachment(refUrl)) {
    return (
      <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" className="block">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URLs change; next/image can't cache them
          <img
            src={url}
            alt={name}
            className="max-h-60 w-full max-w-[260px] rounded-xl object-cover transition-opacity hover:opacity-90"
          />
        ) : (
          <span className="flex h-40 w-[220px] items-center justify-center rounded-xl bg-black/5">
            <ImageIcon className="h-6 w-6 opacity-40" />
          </span>
        )}
      </a>
    );
  }
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex max-w-[260px] items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors",
        mine ? "bg-white/15 hover:bg-white/25" : "bg-black/5 hover:bg-black/10"
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{name}</span>
    </a>
  );
}

// ---------- Helpers ----------

function dayLabel(iso: string, t: Dictionary, formatDate: (iso: string, o?: Intl.DateTimeFormatOptions) => string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t.common.today;
  if (d.toDateString() === yesterday.toDateString()) return t.common.yesterday;
  return formatDate(iso, { weekday: "short", month: "short", day: "numeric" });
}

// ---------- Thread ----------

export function ChatThread({
  conversationId,
  viewer,
  onCreate,
  emptyState,
  allowInternalNotes = false,
  placeholder,
  className,
  autoFocus,
}: {
  /** null until the first message creates the conversation. */
  conversationId: string | null;
  viewer: Viewer;
  /** Creates the conversation with the first message; returns its id. */
  onCreate?: (text: string) => Promise<{ id: string } | { error: string }>;
  emptyState?: ReactNode;
  allowInternalNotes?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const { t, format, formatDate, formatTime } = useI18n();
  const T = t.chat.thread;
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(!!conversationId);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [internal, setInternal] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const [dragging, setDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<{ sendTyping: () => void; leave: () => void } | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tempCounter = useRef(0);
  const convRef = useRef(conversationId);
  const atBottomRef = useRef(true);

  useEffect(() => {
    convRef.current = conversationId;
  }, [conversationId]);

  const isMine = useCallback(
    (m: Message) => (viewer === "customer" ? m.senderRole === "customer" : m.senderRole !== "customer"),
    [viewer]
  );

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setUnseen(0);
  }, []);

  const markRead = useCallback(() => {
    const id = convRef.current;
    if (id && document.visibilityState === "visible") markConversationRead(id);
  }, []);

  // ----- Load + realtime for the current conversation -----
  useEffect(() => {
    if (!conversationId) return;
    let active = true;

    fetchThread(conversationId, viewer === "staff").then((rows) => {
      if (!active) return;
      setMessages((prev) => {
        // Keep messages still being sent (e.g. the first one that created the conversation).
        const pending = prev.filter((m) => m.status);
        return [...rows, ...pending.filter((p) => !rows.some((r) => r.content === p.content && isMine(r)))];
      });
      setLoading(false);
      requestAnimationFrame(() => scrollToBottom(false));
      markRead();
    });

    const unsubscribe = subscribeToThread(conversationId, {
      onInsert: (msg) => {
        if (viewer === "customer" && msg.isInternalNote) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Replace my optimistic copy with the saved message.
          const tempIndex = prev.findIndex((m) => m.status === "sending" && isMine(msg) && m.content === msg.content);
          if (tempIndex >= 0) {
            const next = [...prev];
            next[tempIndex] = msg;
            return next;
          }
          return [...prev, msg];
        });
        if (!isMine(msg)) {
          setOtherTyping(false);
          markRead();
          if (!atBottomRef.current) setUnseen((n) => n + 1);
        }
      },
      onUpdate: (msg) => setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, readAt: msg.readAt } : m))),
    });

    const typing = joinTypingChannel(conversationId, viewer, () => {
      setOtherTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setOtherTyping(false), 3500);
    });
    typingRef.current = typing;

    const onVisible = () => markRead();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      unsubscribe();
      typing.leave();
      typingRef.current = null;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [conversationId, viewer, isMine, markRead, scrollToBottom]);

  // Follow new messages when the reader is already at the bottom.
  useLayoutEffect(() => {
    if (atBottomRef.current) scrollToBottom(true);
  }, [messages.length, otherTyping, scrollToBottom]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus, conversationId]);

  // ----- Sending -----
  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => {
      if (f.size > MAX_ATTACHMENT_BYTES) {
        setError(format(T.tooLarge, { name: f.name }));
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...picked].slice(0, 6));
  };

  async function deliver(temp: UiMessage) {
    const text = temp.content;
    const localFiles = temp.localFiles ?? [];
    try {
      let convId = convRef.current;

      if (!convId) {
        if (!onCreate) throw new Error("No conversation.");
        const created = await onCreate(text || T.attachment);
        if ("error" in created) throw new Error(created.error);
        convId = created.id;
        convRef.current = convId;
        if (localFiles.length === 0) {
          // The first message was sent by onCreate; the thread will load it.
          setMessages((prev) => prev.filter((m) => m.id !== temp.id));
          return;
        }
        const refs = await Promise.all(localFiles.map((f) => uploadChatAttachment(convId!, f)));
        const res = await sendMessage({ conversationId: convId, content: "", attachments: refs });
        if (!res.success) throw new Error(res.error ?? T.attachmentNotSent);
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        return;
      }

      const refs = await Promise.all(localFiles.map((f) => uploadChatAttachment(convId!, f)));
      const res = await sendMessage({
        conversationId: convId,
        content: text,
        attachments: refs,
        isInternalNote: temp.isInternalNote,
      });
      if (!res.success) throw new Error(res.error ?? T.notSent);
      const saved = res.data as Parameters<typeof import("@/lib/client-queries").mapMessageRow>[0] | undefined;
      setMessages((prev) => {
        if (saved && prev.some((m) => m.id === saved.id)) return prev.filter((m) => m.id !== temp.id);
        return prev.map((m) =>
          m.id === temp.id
            ? {
                ...m,
                id: saved?.id ?? m.id,
                createdAt: saved?.created_at ?? m.createdAt,
                attachments: refs,
                status: undefined,
                localFiles: undefined,
              }
            : m
        );
      });
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, status: "failed" } : m)));
      setError(e instanceof Error ? e.message : T.notSent);
    }
  }

  function send() {
    const text = input.trim();
    if (!text && files.length === 0) return;
    setError(null);
    const temp: UiMessage = {
      id: `temp-${++tempCounter.current}`,
      conversationId: convRef.current ?? "",
      senderId: "",
      senderRole: viewer === "customer" ? "customer" : "agent",
      content: text,
      attachments: [],
      isInternalNote: allowInternalNotes && internal,
      createdAt: "",
      status: "sending",
      localFiles: files,
    };
    setMessages((prev) => [...prev, temp]);
    setInput("");
    setFiles([]);
    atBottomRef.current = true;
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
    deliver(temp);
  }

  function retry(m: UiMessage) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "sending" } : x)));
    deliver({ ...m, status: "sending" });
  }

  // ----- Render -----
  const visible = messages;

  return (
    <div
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          atBottomRef.current = bottom;
          setAtBottom(bottom);
          if (bottom) setUnseen(0);
        }}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        role="log"
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
                <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-surface-secondary" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          emptyState ?? (
            <p className="py-10 text-center text-sm text-text-secondary">{T.empty}</p>
          )
        ) : (
          visible.map((m, i) => {
            const prev = visible[i - 1];
            const mine = isMine(m);
            // Brand colours: our team speaks in red, customers in gold — on every screen.
            const fromTeam = m.senderRole !== "customer";
            const filled = !m.isInternalNote && fromTeam; // white-on-colour attachments
            const newDay =
              m.createdAt && (!prev?.createdAt || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString());
            const grouped =
              prev &&
              !newDay &&
              prev.senderRole === m.senderRole &&
              prev.isInternalNote === m.isInternalNote &&
              (!m.createdAt || !prev.createdAt || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000);
            const senderLabel =
              m.senderRole === "customer"
                ? viewer === "staff" ? T.customer : T.you
                : m.senderRole === "ai"
                  ? T.assistant
                  : viewer === "staff" ? T.team : T.brand;

            return (
              <Fragment key={m.id}>
                {newDay && (
                  <div className="my-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-text-disabled">
                    <span className="h-px flex-1 bg-border" />
                    {dayLabel(m.createdAt, t, formatDate)}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex animate-[fade-in-up_0.3s_ease-out]",
                    mine ? "justify-end" : "justify-start",
                    grouped ? "mt-1" : "mt-3"
                  )}
                >
                  <div className={cn("flex max-w-[82%] flex-col", mine ? "items-end" : "items-start")}>
                    {!grouped && !mine && (
                      <span className="mb-1 px-1 text-[11px] font-medium text-text-secondary">{senderLabel}</span>
                    )}
                    {m.isInternalNote && !grouped && (
                      <span className="mb-1 inline-flex items-center gap-1 px-1 text-[11px] font-medium text-warning">
                        <Lock className="h-3 w-3" /> {T.internalNote}
                      </span>
                    )}
                    <div
                      className={cn(
                        "space-y-2 whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        m.isInternalNote
                          ? "rounded-2xl border border-warning/30 bg-warning/10 text-text-primary"
                          : cn(
                              "rounded-2xl",
                              mine ? "rounded-br-md" : "rounded-bl-md",
                              fromTeam ? "bg-brand text-white" : "bg-gold text-navy"
                            ),
                        m.status === "sending" && "opacity-70",
                        m.status === "failed" && "ring-2 ring-error/50"
                      )}
                    >
                      {m.content && <p>{m.content}</p>}
                      {m.attachments.map((a) => (
                        <Attachment key={a} refUrl={a} mine={filled} />
                      ))}
                      {m.localFiles?.map((f) => (
                        <span key={f.name} className="flex items-center gap-2 text-xs opacity-80">
                          <Loader2 className="h-3 w-3 animate-spin" /> {f.name}
                        </span>
                      ))}
                    </div>
                    <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-text-disabled">
                      {m.status === "failed" ? (
                        <button onClick={() => retry(m)} className="flex items-center gap-1 font-medium text-error">
                          <RotateCcw className="h-3 w-3" /> {T.retry}
                        </button>
                      ) : m.status === "sending" ? (
                        T.sending
                      ) : (
                        <>
                          {m.createdAt ? formatTime(m.createdAt) : ""}
                          {mine &&
                            !m.isInternalNote &&
                            (m.readAt ? (
                              <CheckCheck className="h-3.5 w-3.5 text-info" aria-label={T.read} />
                            ) : (
                              <Check className="h-3.5 w-3.5" aria-label={T.sent} />
                            ))}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </Fragment>
            );
          })
        )}

        {otherTyping && (
          <div className="mt-3 flex animate-[fade-in_0.2s_ease-out] justify-start" aria-label={T.typing}>
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-secondary px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-text-disabled"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New messages pill */}
      {!atBottom && unseen > 0 && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 flex -translate-x-1/2 animate-[fade-in-up_0.3s_ease-out] items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        >
          <ArrowDown className="h-3.5 w-3.5" /> {unseen === 1 ? T.newMessage : format(T.newMessages, { n: unseen })}
        </button>
      )}

      {/* Drop zone */}
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-brand-light/80 text-sm font-semibold text-brand">
          {T.dropFiles}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border bg-surface p-3">
        {error && (
          <p className="mb-2 flex items-center justify-between rounded-lg bg-error/10 px-3 py-1.5 text-xs text-error">
            {error}
            <button onClick={() => setError(null)} aria-label={T.dismiss}>
              <X className="h-3.5 w-3.5" />
            </button>
          </p>
        )}
        {allowInternalNotes && (
          <button
            type="button"
            onClick={() => setInternal((v) => !v)}
            className={cn(
              "mb-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              internal ? "border-warning/30 bg-warning/10 text-warning" : "border-border text-text-secondary hover:bg-surface-secondary"
            )}
          >
            <Lock className="h-3 w-3" />
            {internal ? T.internalOn : T.internalOff}
          </button>
        )}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs">
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label={format(T.removeFile, { name: f.name })}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={T.attach}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-navy"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              if (e.target.value.trim()) typingRef.current?.sendTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            onPaste={(e) => {
              const pasted = Array.from(e.clipboardData.files);
              if (pasted.length) {
                e.preventDefault();
                addFiles(pasted);
              }
            }}
            placeholder={internal ? T.internalPlaceholder : placeholder ?? T.placeholder}
            aria-label={T.messageLabel}
            className={cn(
              "min-h-11 flex-1 resize-none rounded-[22px] border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none",
              internal ? "border-warning/40 focus:border-warning" : "border-border focus:border-navy"
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() && files.length === 0}
            aria-label={T.send}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-90 disabled:opacity-40",
              internal ? "bg-warning" : "bg-brand hover:bg-brand-hover"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
