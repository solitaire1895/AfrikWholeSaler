import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";

// /sitemap.xml — public pages, every active product and category, each in
// its four language versions. Regenerated at most once an hour.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/quote", priority: 0.7, changeFrequency: "monthly" },
  { path: "/track", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

const entry = (
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {}
): MetadataRoute.Sitemap[number] => ({
  url: absoluteUrl(path, "fr"),
  alternates: { languages: languageAlternates(path) },
  ...extra,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public catalog data only: the anonymous key, no cookies.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at, images").eq("is_active", true).limit(10000),
    supabase.from("categories").select("slug, updated_at"),
  ]);

  return [
    ...STATIC_PAGES.map((p) => entry(p.path, { priority: p.priority, changeFrequency: p.changeFrequency })),
    ...(categories ?? []).map((c) =>
      entry(`/categories/${encodeURIComponent(c.slug)}`, { lastModified: c.updated_at ?? undefined, changeFrequency: "weekly", priority: 0.7 })
    ),
    ...(products ?? []).map((p) =>
      entry(`/products/${encodeURIComponent(p.slug)}`, {
        lastModified: p.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.8,
        images: Array.isArray(p.images) ? (p.images as string[]).slice(0, 3) : undefined,
      })
    ),
  ];
}
