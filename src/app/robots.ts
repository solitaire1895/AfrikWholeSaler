import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/seo";

// /robots.txt — private and per-user areas stay out of search engines.
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/dashboard", "/admin", "/cart", "/checkout", "/login", "/register", "/search", "/api/", "/monitoring"];
  const withLanguages = privatePaths.flatMap((p) => [p, `/en${p}`, `/es${p}`, `/zh${p}`]);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: withLanguages }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
