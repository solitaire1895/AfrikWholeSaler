"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Package,
  ChevronDown,
  FileText,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { categories } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/search/search-bar";
import { CartButton } from "@/components/cart/cart-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useI18n } from "@/i18n/client";
import { categoryName } from "@/i18n/names";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";

export function Navbar() {
  const { t, format } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role ?? null);
      } else {
        setUserRole(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setUserRole(profile?.role ?? null);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    window.location.href = "/";
  };

  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-border/60 shadow-[var(--shadow-card)]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] gradient-primary">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-navy tracking-tight">
            Afrik<span className="text-brand">Wholesaler</span>
          </span>
        </Link>

        {/* Center Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar className="w-full" />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Categories Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors">
              {t.layout.nav.categories}
              <ChevronDown className="h-4 w-4" />
            </button>
            {megaMenuOpen && (
              <div className="absolute top-full left-0 pt-2 w-[480px]">
                <div className="grid grid-cols-2 gap-1 p-4 bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-dropdown)] border border-border">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] hover:bg-surface-secondary transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-brand-light text-brand">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {categoryName(t, cat.slug, cat.name)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {format(t.layout.nav.productsCount, { n: cat.productCount })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/products"
            className="px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors"
          >
            {t.layout.nav.products}
          </Link>
          <Link
            href="/quote"
            className="px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors"
          >
            {t.layout.nav.requestQuote}
          </Link>
          <Link
            href="/how-it-works"
            className="px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors"
          >
            {t.layout.nav.howItWorks}
          </Link>
          <Link
            href="/track"
            className="px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors"
          >
            {t.tracking.trackOrder}
          </Link>
        </div>

        {/* Cart (all screen sizes) */}
        <div className="ml-auto flex items-center md:ml-0">
          <CurrencySwitcher className="hidden sm:block" />
          <LanguageSwitcher />
          <NotificationBell />
          <CartButton />
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary hover:text-brand transition-colors rounded-[var(--radius-sm)] hover:bg-surface-secondary"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-brand text-xs font-semibold">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-dropdown)] border border-border py-2"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-brand hover:bg-surface-secondary transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t.layout.nav.dashboard}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-brand hover:bg-surface-secondary transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      {t.layout.nav.adminPanel}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-error hover:bg-surface-secondary transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.layout.nav.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ButtonLink href="/login" variant="ghost" size="sm">
              <User className="h-4 w-4" />
              {t.layout.nav.login}
            </ButtonLink>
          )}
          <ButtonLink href="/quote" variant="primary" size="sm">
            <FileText className="h-4 w-4" />
            {t.layout.nav.getQuote}
          </ButtonLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-text-primary hover:bg-surface-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t.layout.nav.toggleMenu}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-surface border-t border-border shadow-[var(--shadow-dropdown)]">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Search */}
            <SearchBar onNavigate={() => setMobileOpen(false)} />

            <div className="flex items-center justify-between px-3 sm:hidden">
              <span className="text-sm font-medium text-text-primary">{t.layout.currency.title}</span>
              <CurrencySwitcher />
            </div>

            <Link
              href="/products"
              className="block px-3 py-2 text-sm font-medium text-text-primary hover:text-brand"
              onClick={() => setMobileOpen(false)}
            >
              {t.layout.nav.products}
            </Link>
            <Link
              href="/quote"
              className="block px-3 py-2 text-sm font-medium text-text-primary hover:text-brand"
              onClick={() => setMobileOpen(false)}
            >
              {t.layout.nav.requestQuote}
            </Link>
            <Link
              href="/how-it-works"
              className="block px-3 py-2 text-sm font-medium text-text-primary hover:text-brand"
              onClick={() => setMobileOpen(false)}
            >
              {t.layout.nav.howItWorks}
            </Link>
            <Link
              href="/track"
              className="block px-3 py-2 text-sm font-medium text-text-primary hover:text-brand"
              onClick={() => setMobileOpen(false)}
            >
              {t.tracking.trackOrder}
            </Link>

            <div className="pt-2 border-t border-border">
              <p className="px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                {t.layout.nav.categories}
              </p>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="block px-3 py-2 text-sm text-text-secondary hover:text-brand"
                  onClick={() => setMobileOpen(false)}
                >
                  {categoryName(t, cat.slug, cat.name)}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <>
                  <ButtonLink
                    href="/dashboard"
                    variant="secondary"
                    size="md"
                    className="w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t.layout.nav.dashboard}
                  </ButtonLink>
                  {isAdmin && (
                    <ButtonLink
                      href="/admin"
                      variant="secondary"
                      size="md"
                      className="w-full"
                    >
                      <Shield className="h-4 w-4" />
                      {t.layout.nav.adminPanel}
                    </ButtonLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface text-sm font-medium text-text-secondary hover:text-error hover:border-error/20 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.layout.nav.signOut}
                  </button>
                </>
              ) : (
                <ButtonLink
                  href="/login"
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  <User className="h-4 w-4" />
                  {t.layout.nav.login}
                </ButtonLink>
              )}
              <ButtonLink
                href="/quote"
                variant="primary"
                size="md"
                className="w-full"
              >
                <FileText className="h-4 w-4" />
                {t.layout.nav.getQuote}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}