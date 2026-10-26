"use client";

import { useState } from "react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  FileText,
  MessageCircle,
  User,
  Package,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";


export function DashboardShell({
  customer,
  isAdmin = false,
  children,
}: {
  customer: Customer;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useT();
  const S = t.account.shell;
  const navItems = [
    { href: "/dashboard", label: S.overview, icon: LayoutDashboard },
    { href: "/dashboard/orders", label: S.orders, icon: ShoppingBag },
    { href: "/dashboard/shipments", label: S.shipments, icon: Truck },
    { href: "/dashboard/quotes", label: S.quotes, icon: FileText },
    { href: "/dashboard/messages", label: S.messages, icon: MessageCircle },
    { href: "/dashboard/affiliate", label: S.affiliate, icon: Coins },
    { href: "/dashboard/profile", label: S.profile, icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={S.menu}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-text-primary hover:bg-surface-secondary"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] gradient-primary">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-navy tracking-tight hidden sm:block">
                Afrik<span className="text-brand">Wholesaler</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="text-sm font-medium text-text-secondary hover:text-brand hidden sm:block"
            >
              {S.browse}
            </Link>
            <CurrencySwitcher className="hidden sm:block" />
            <LanguageSwitcher />
            <NotificationBell />
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand font-semibold text-sm">
                {customer.firstName[0]}
                {customer.lastName[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-text-primary">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-xs text-text-secondary">
                  {customer.company}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
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
              {S.section}
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
                  {item.label}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-brand hover:bg-brand-light transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  {S.admin}
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {S.signOut}
              </Link>
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-20 bg-navy/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}