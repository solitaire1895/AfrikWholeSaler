"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { trackStaffPresence } from "@/lib/chat";
import { useI18n } from "@/i18n/client";
import { useCurrency } from "@/lib/currency-context";
import { notificationText } from "@/i18n/notification-text";

// ========================================================
// In-app notifications: realtime list, bell count, toasts,
// sound, desktop notifications and the tab-title badge.
// Rows are created by database triggers (supabase/chat_notifications.sql).
// ========================================================

export interface AppNotification {
  id: string;
  type: "message" | "order" | "payment" | "shipment" | "quote" | "system" | string;
  title: string;
  body: string | null;
  link: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsValue {
  userId: string | null;
  isStaff: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  /** Unread chat notifications — drives the chat launcher badge. */
  unreadChats: number;
  toasts: AppNotification[];
  dismissToast: (id: string) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  desktopPermission: NotificationPermission | "unsupported";
  requestDesktop: () => Promise<void>;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  /** Conversation the user is looking at — no toast/sound for it. */
  setActiveConversation: (id: string | null) => void;
}

const Ctx = createContext<NotificationsValue | null>(null);

const STAFF_ROLES = ["sales_rep", "support_agent", "warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin"];
const SOUND_KEY = "aw-notify-sound";

/** Order notifications open the order's tracking page (customer or staff side). */
function linkFor(link: string | null, data: Record<string, unknown>): string | null {
  const orderId = typeof data.order_id === "string" ? data.order_id : null;
  if (!orderId || !link) return link;
  if (link.startsWith("/dashboard/orders")) return `/dashboard/orders/${orderId}`;
  if (link.startsWith("/admin/orders")) return `/admin/orders/${orderId}`;
  return link;
}

function mapRow(r: Record<string, unknown>): AppNotification {
  const data = (r.data as Record<string, unknown>) ?? {};
  return {
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    body: (r.body as string) ?? null,
    link: linkFor((r.link as string) ?? null, data),
    data,
    readAt: (r.read_at as string) ?? null,
    createdAt: r.created_at as string,
  };
}

/** Short two-note chime generated with WebAudio (no sound file needed). */
function playChime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // audio blocked until the user interacts with the page — ignore
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | "unsupported">("default");
  const [soundOn, setSoundOnState] = useState(true);
  const activeConversation = useRef<string | null>(null);
  const soundRef = useRef(true);
  const { t, formatNumber } = useI18n();
  const { formatPrice } = useCurrency();
  // Latest translator for the desktop-notification callback.
  const textRef = useRef((n: AppNotification) => notificationText(t, n, { formatPrice, formatNumber }));
  useEffect(() => {
    textRef.current = (n: AppNotification) => notificationText(t, n, { formatPrice, formatNumber });
  }, [t, formatPrice, formatNumber]);

  // Initial browser capabilities / preferences.
  useEffect(() => {
    const perm = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
    let sound = true;
    try {
      sound = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      // ignore
    }
    soundRef.current = sound;
    // One-time sync from browser-only APIs after hydration.
    queueMicrotask(() => {
      setDesktopPermission(perm);
      setSoundOnState(sound);
    });
  }, []);

  // Who is logged in (and are they staff)?
  useEffect(() => {
    const supabase = createClient();
    const apply = async (uid: string | null) => {
      setUserId(uid);
      if (!uid) {
        setIsStaff(false);
        setNotifications([]);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      setIsStaff(!!profile && STAFF_ROLES.includes(profile.role));
    };
    supabase.auth.getUser().then(({ data: { user } }) => apply(user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") apply(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Staff show as "online" to customers while the site is open.
  useEffect(() => {
    if (!userId || !isStaff) return;
    return trackStaffPresence(userId);
  }, [userId, isStaff]);

  const announce = useCallback((n: AppNotification) => {
    const isActiveChat =
      n.type === "message" &&
      activeConversation.current &&
      n.data.conversation_id === activeConversation.current &&
      document.visibilityState === "visible";
    if (isActiveChat) return;

    setToasts((prev) => [n, ...prev.filter((t) => t.id !== n.id)].slice(0, 3));
    if (soundRef.current) playChime();

    if (document.visibilityState !== "visible" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const text = textRef.current(n);
        const desktop = new Notification(text.title, {
          body: text.body ?? undefined,
          icon: "/favicon.ico",
          tag: (n.data.conversation_id as string) || n.id,
        });
        desktop.onclick = () => {
          window.focus();
          if (n.link) window.location.href = n.link;
          desktop.close();
        };
      } catch {
        // some mobile browsers only allow notifications from a service worker
      }
    }
  }, []);

  // Load + realtime.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let active = true;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (active && data) setNotifications(data.map(mapRow));
      });

    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (p) => {
          const n = mapRow(p.new as Record<string, unknown>);
          setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50));
          announce(n);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (p) => {
          const n = mapRow(p.new as Record<string, unknown>);
          setNotifications((prev) => {
            const rest = prev.filter((x) => x.id !== n.id);
            return [n, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          });
          // A grouped chat notification that got a new message ("3 new messages").
          if (!n.readAt && n.type === "message") announce(n);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, announce]);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(0, -1)), 6000);
    return () => clearTimeout(t);
  }, [toasts]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const unreadChats = notifications
    .filter((n) => !n.readAt && n.type === "message")
    .reduce((sum, n) => sum + Number(n.data.count ?? 1), 0);

  // "(3) AfrikWholesaler" in the browser tab.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = unreadCount > 0 ? `(${unreadCount > 9 ? "9+" : unreadCount}) ${base}` : base;
  }, [unreadCount]);

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? now } : n)));
    await createClient().from("notifications").update({ read_at: now }).eq("id", id).is("read_at", null);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    await createClient().from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  }, [userId]);

  const requestDesktop = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    setDesktopPermission(await Notification.requestPermission());
  }, []);

  const setSoundOn = useCallback((on: boolean) => {
    soundRef.current = on;
    setSoundOnState(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({
      userId,
      isStaff,
      notifications,
      unreadCount,
      unreadChats,
      toasts,
      dismissToast: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
      markRead,
      markAllRead,
      desktopPermission,
      requestDesktop,
      soundOn,
      setSoundOn,
      setActiveConversation: (id) => {
        activeConversation.current = id;
      },
    }),
    [userId, isStaff, notifications, unreadCount, unreadChats, toasts, markRead, markAllRead, desktopPermission, requestDesktop, soundOn, setSoundOn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}
