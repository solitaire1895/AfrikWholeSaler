"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { splitLocalePath } from "@/i18n/routing";
import {
  Menu,
  X,
  Search,
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
  const [searchOpen, setSearchOpen] = useState(false);
  const currentPath = splitLocalePath(usePathname() || "/").path;
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);
  // Editorial nav link: small uppercase spaced type, red underline on hover / when active.
  const navLink = (active: boolean) =>
    cn(
      "relative whitespace-nowrap px-3 py-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors",
      "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-brand after:transition-transform after:duration-300",
      active ? "text-navy after:scale-x-100" : "text-text-secondary hover:text-navy after:scale-x-0 hover:after:scale-x-100"
    );
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

        {/* Desktop links — centred, one line each */}
        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {/* Categories Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <button className={cn(navLink(megaMenuOpen), "flex items-center gap-1")} aria-expanded={megaMenuOpen}>
              {t.layout.nav.categories}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaMenuOpen && "rotate-180")} />
            </button>
            {megaMenuOpen && (
              <div className="absolute left-1/2 top-full w-[520px] -translate-x-1/2 pt-3">
                <div className="grid animate-[scale-in_0.15s_ease-out] grid-cols-2 gap-1 rounded-[20px] border border-border bg-surface p-3 shadow-[var(--shadow-dropdown)]">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="flex items-center gap-3 rounded-[14px] p-3 transition-colors hover:bg-cream"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">{categoryName(t, cat.slug, cat.name)}</p>
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

          <Link href="/products" className={navLink(isActive("/products"))}>
            {t.layout.nav.products}
          </Link>
          <Link href="/track" className={cn(navLink(isActive("/track")), "hidden 2xl:block")}>
            {t.tracking.trackOrder}
          </Link>
        </div>

        {/* Utilities: search, currency, language, notifications, cart */}
        <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
          <button
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? t.layout.nav.closeSearch : t.layout.nav.openSearch}
            aria-expanded={searchOpen}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface-secondary md:flex"
          >
            {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </button>
          <CurrencySwitcher className="hidden sm:block" />
          <LanguageSwitcher />
          <NotificationBell />
          <CartButton />
        </div>

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-border md:block" />

        {/* CTAs */}
        <div className="hidden shrink-0 items-center gap-2 whitespace-nowrap md:flex">
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

      {/* Desktop search panel, full width under the bar */}
      {searchOpen && (
        <div className="hidden border-t border-border/60 bg-surface/95 backdrop-blur md:block">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <SearchBar className="w-full" autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

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