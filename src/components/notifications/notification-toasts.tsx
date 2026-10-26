"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";
import { NotificationIcon, useNotificationText } from "@/components/notifications/notification-bell";
import { useT } from "@/i18n/client";

/** Pop-up cards for new notifications (top-right on desktop, top on mobile). */
export function NotificationToasts() {
  const router = useRouter();
  const { toasts, dismissToast, markRead } = useNotifications();
  const t = useT();
  const textOf = useNotificationText();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-3 z-[95] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-20 sm:w-96"
    >
      {toasts.map((toast) => {
        const text = textOf(toast);
        return (
        <div
          key={`${toast.id}-${toast.createdAt}`}
          role="status"
          className="pointer-events-auto flex w-full animate-[toast-in_0.4s_cubic-bezier(0.22,1,0.36,1)] gap-3 rounded-[18px] border border-border bg-surface p-3 pr-2 shadow-[var(--shadow-modal)]"
        >
          <button
            className="flex min-w-0 flex-1 gap-3 text-left"
            onClick={() => {
              markRead(toast.id);
              dismissToast(toast.id);
              if (toast.link) router.push(toast.link);
            }}
          >
            <NotificationIcon type={toast.type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy">{text.title}</span>
              {text.body && <span className="mt-0.5 line-clamp-2 block text-xs text-text-secondary">{text.body}</span>}
            </span>
          </button>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label={t.notify.bell.dismiss}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-disabled hover:bg-surface-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        );
      })}
    </div>
  );
}
