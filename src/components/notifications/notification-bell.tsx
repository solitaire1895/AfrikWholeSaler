"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageCircle,
  Package,
  CreditCard,
  Truck,
  FileText,
  Info,
  CheckCheck,
  Volume2,
  VolumeX,
  MonitorSmartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type AppNotification } from "@/lib/notifications-context";
import { useI18n } from "@/i18n/client";
import { useCurrency } from "@/lib/currency-context";
import { notificationText } from "@/i18n/notification-text";

const ICONS: Record<string, { icon: typeof Bell; className: string }> = {
  message: { icon: MessageCircle, className: "bg-info/10 text-info" },
  order: { icon: Package, className: "bg-brand-light text-brand" },
  payment: { icon: CreditCard, className: "bg-success/10 text-success" },
  shipment: { icon: Truck, className: "bg-gold-light text-gold" },
  quote: { icon: FileText, className: "bg-navy/10 text-navy" },
};

export function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const meta = ICONS[type] ?? { icon: Info, className: "bg-surface-secondary text-text-secondary" };
  const Icon = meta.icon;
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.className, className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** Translated title/body for a notification (shared with the pop-ups). */
export function useNotificationText() {
  const { t, formatNumber } = useI18n();
  const { formatPrice } = useCurrency();
  return (n: AppNotification) => notificationText(t, n, { formatPrice, formatNumber });
}

/**
 * Bell with unread badge and a dropdown of recent notifications.
 * `tone="dark"` for the admin header.
 */
export function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const {
    userId,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    desktopPermission,
    requestDesktop,
    soundOn,
    setSoundOn,
  } = useNotifications();
  const { t, format, timeAgo } = useI18n();
  const B = t.notify.bell;
  const textOf = useNotificationText();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    // keep "x min ago" fresh while open
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      clearInterval(t);
    };
  }, [open]);

  if (!userId) return null;

  function openNotification(n: AppNotification) {
    markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? format(B.labelUnread, { n: unreadCount }) : B.label}
        aria-expanded={open}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          tone === "dark" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-text-primary hover:bg-surface-secondary hover:text-brand"
        )}
      >
        <Bell key={unreadCount} className={cn("h-5 w-5", unreadCount > 0 && "animate-[bell-ring_0.8s_ease-in-out]")} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-[cart-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-[90] animate-[scale-in_0.18s_ease-out] overflow-hidden rounded-[20px] border border-border bg-surface text-text-primary shadow-[var(--shadow-dropdown)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:origin-top-right">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-semibold text-navy">{B.title}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundOn(!soundOn)}
                aria-label={soundOn ? B.mute : B.unmute}
                title={soundOn ? B.soundOn : B.soundOff}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
              >
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-brand"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> {B.markAll}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label={B.close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {desktopPermission === "default" && (
            <button
              onClick={requestDesktop}
              className="flex w-full items-center gap-3 border-b border-border bg-cream/60 px-4 py-3 text-left text-xs text-navy hover:bg-cream"
            >
              <MonitorSmartphone className="h-4 w-4 shrink-0 text-brand" />
              <span>
                <strong>{B.desktopTitle}</strong> {B.desktopText}
              </span>
            </button>
          )}

          <ul className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-6 py-10 text-center text-sm text-text-secondary">
                <Bell className="mx-auto mb-2 h-6 w-6 text-text-disabled" />
                {B.empty}
              </li>
            ) : (
              notifications.map((n) => {
                const text = textOf(n);
                return (
                <li key={n.id}>
                  <button
                    onClick={() => openNotification(n)}
                    className={cn(
                      "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-surface-secondary/60",
                      !n.readAt && "bg-brand-light/40"
                    )}
                  >
                    <NotificationIcon type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", !n.readAt ? "font-semibold text-navy" : "text-text-primary")}>
                        {text.title}
                      </span>
                      {text.body && <span className="mt-0.5 line-clamp-2 block text-xs text-text-secondary">{text.body}</span>}
                      <span className="mt-1 block text-[11px] text-text-disabled">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label={B.unread} />}
                  </button>
                </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
