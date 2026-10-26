import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { LOCALE_HEADER, PATH_HEADER, localizePath, prefixedLocales, splitLocalePath } from "@/i18n/routing";

/**
 * Cookie options for persistent sessions (30 days).
 * Ensures users stay logged in across browser restarts.
 */
const cookieOptions = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
  secure: true,
  path: "/",
};

const STAFF_ROLES = [
  "sales_rep",
  "support_agent",
  "warehouse_staff",
  "logistics_staff",
  "operations_manager",
  "admin",
  "super_admin",
];

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse/i;

/** First visit only: a browser that prefers English, Spanish or Chinese goes to that version once. */
function preferredPrefixedLocale(request: NextRequest): Locale | null {
  if (request.method !== "GET" || request.headers.get("rsc") || request.headers.get("next-router-prefetch")) return null;
  if (BOT.test(request.headers.get("user-agent") ?? "")) return null;
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) return null;
  const first = (request.headers.get("accept-language") ?? "").split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return (prefixedLocales as string[]).includes(first) ? (first as Locale) : null;
}

/**
 * Proxy (formerly middleware in Next.js < 16) runs before routes.
 * - Language URLs: /en/…, /es/…, /zh/… are rewritten to the plain page with
 *   the language passed in a header (French has no prefix).
 * - Refreshes the Supabase auth session on every request.
 * - Protects routes that require authentication.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale: urlLocale, path } = splitLocalePath(pathname);
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  // First visit without a saved language: follow the browser's preference once.
  if (!urlLocale && !isLocale(cookieLocale)) {
    const preferred = preferredPrefixedLocale(request);
    if (preferred) {
      const url = request.nextUrl.clone();
      url.pathname = localizePath(path, preferred);
      const res = NextResponse.redirect(url);
      res.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      return res;
    }
  }

  // The URL decides the language; plain URLs use the saved choice, else French.
  const locale: Locale = urlLocale ?? (isLocale(cookieLocale) ? cookieLocale : defaultLocale);

  const makeResponse = () => {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, locale);
    headers.set(PATH_HEADER, path);
    if (!urlLocale) return NextResponse.next({ request: { headers } });
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.rewrite(url, { request: { headers } });
  };

  let response = makeResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = makeResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...cookieOptions, ...options })
          );
        },
      },
    }
  );

  // Refresh the session — this is critical for keeping users logged in.
  // Do not run getUser() between createServerClient and the protected route check
  // as it will break the cookie refresh flow.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected route groups (checked on the path without the language prefix)
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");

  const redirectTo = (target: string, keepReturn: boolean) => {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(target, locale);
    url.search = "";
    if (keepReturn) url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  };

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) return redirectTo("/products", false);

  // Protect dashboard and admin routes — require authentication
  if ((isDashboardRoute || isAdminRoute) && !user) return redirectTo("/login", true);

  // Role-based access control for admin routes
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    // Authenticated but not staff — back to the customer dashboard
    if (!profile || !STAFF_ROLES.includes(profile.role)) return redirectTo("/dashboard", false);
  }

  // A language URL also becomes the saved choice, so plain links clicked next stay in it.
  if (urlLocale && cookieLocale !== urlLocale) {
    response.cookies.set(LOCALE_COOKIE, urlLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - monitoring (Sentry tunnel)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - auth callback route (handled separately)
     * - landing/ (public media)
     */
    "/((?!api|monitoring|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|landing/).*)",
  ],
};
