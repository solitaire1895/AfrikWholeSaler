"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/auth-helpers";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/client";
import { authErrorMessage } from "@/i18n/auth-errors";

function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only same-site paths: "/dashboard/orders" is fine; "https://…", "//…" and "/\…" are not.
  const requested = searchParams.get("redirect") ?? "";
  const redirect = isSafeRedirect(requested) ? requested : "/products";
  const t = useT();
  const L = t.auth.login;
  const E = t.auth.errors;

  const [showPassword, setShowPassword] = useState(false);
  // Default to true so users stay logged in across visits (30-day persistent cookies).
  // When unchecked, cookies are downgraded to session-only (cleared on browser close).
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = E.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = E.emailInvalid;
    if (!password) newErrors.password = E.passwordRequired;
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrors({ general: authErrorMessage(t, error.message) });
        } else {
          // If "Remember me" is unchecked, downgrade the persistent cookies
          // (30-day expiry) to session-only cookies that expire when the
          // browser is closed. We do this by re-setting each auth cookie
          // without a maxAge.
          if (!rememberMe) {
            document.cookie.split(";").forEach((cookie) => {
              const name = cookie.split("=")[0].trim();
              if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
                const value = cookie.split("=").slice(1).join("=").trim();
                document.cookie = `${name}=${value}; path=/; samesite=lax`;
              }
            });
          }

          router.push(redirect);
          router.refresh();
        }
      } catch {
        setErrors({ general: E.unexpected });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-navy tracking-tight mb-2">
          {L.title}
        </h2>
        <p className="text-sm text-text-secondary">
          {L.lead}
        </p>
        {searchParams.get("message") === "check_email" && (
          <p className="mt-4 rounded-[var(--radius-md)] border border-info/20 bg-info/5 p-3 text-sm text-info">{L.checkEmail}</p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={L.email}
          type="email"
          name="email"
          placeholder="you@company.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-text-primary">
              {L.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand hover:text-brand-hover transition-colors"
            >
              {L.forgot}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={L.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-[var(--radius-input)] border border-border bg-surface pl-11 pr-11 text-sm text-text-primary placeholder:text-text-disabled transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
              aria-label={L.togglePassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-error font-medium">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onChange={setRememberMe}
            label={L.remember}
          />
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="rounded-[var(--radius-md)] border border-error/20 bg-error/5 p-3 text-sm text-error">
            {errors.general}
          </div>
        )}

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {L.signingIn}
            </>
          ) : (
            <>
              {L.signIn}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="mt-8 text-center text-sm text-text-secondary">
        {L.noAccount}{" "}
        <Link
          href="/register"
          className="font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          {L.signUp}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
