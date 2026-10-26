"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Truck,
  MessageCircle,
  Settings,
  ShieldCheck,
  PackageCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const navItems = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/products", key: "products", icon: Package },
  { href: "/admin/orders", key: "orders", icon: ShoppingBag },
  { href: "/admin/customers", key: "customers", icon: Users },
  { href: "/admin/quotes", key: "quotes", icon: FileText },
  { href: "/admin/purchase-requests", key: "purchaseRequests", icon: ClipboardList },
  { href: "/admin/shipments", key: "shipments", icon: Truck },
  { href: "/admin/messages", key: "messages", icon: MessageCircle },
  { href: "/admin/affiliates", key: "affiliates", icon: Coins },
  { href: "/admin/inventory", key: "inventory", icon: PackageCheck },
  { href: "/admin/staff", key: "staff", icon: ShieldCheck },
  { href: "/admin/settings", key: "settings", icon: Settings },
] as const;

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();
  const t = useT();
  const S = t.admin.shell;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "AD";
  const roleLabel =
    (t.admin.roles as Record<string, string>)[user.role] ??
    user.role
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  function handleLogout() {
    startLogout(async () => {
      await logout();
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border gradient-dark text-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={S.menu}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] gradient-primary">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight">
                  Afrik<span className="text-gold">Wholesaler</span>
                </span>
                <span className="ml-2 text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                  {S.badge}
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-white/60 hover:text-white hidden sm:block"
            >
              {S.viewSite}
            </Link>
            <LanguageSwitcher tone="dark" />
            <NotificationBell tone="dark" />
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy font-semibold text-sm">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-white/50">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-surface overflow-y-auto transition-transform duration-300",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          <nav className="p-4 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-text-disabled uppercase tracking-wide">
              {S.management}
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-light text-brand"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {S.nav[item.key]}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors w-full disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? S.signingOut : S.signOut}
              </button>
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-20 bg-navy/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}