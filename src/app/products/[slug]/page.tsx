import { cache } from "react";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductDetail, ProductNotFound } from "@/components/products/product-detail";
import { getLocale } from "@/i18n/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";
import type { Product } from "@/types";

// One database read per request, shared by the metadata and the page.
const loadProduct = cache((slug: string) => getProductBySlug(slug));

/** Plain-text summary for search results and share previews. */
function summary(product: Product) {
  const text = (product.description || "").replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { robots: { index: false } };
  const locale = await getLocale();
  const path = `/products/${product.slug}`;
  const description = summary(product);
  return {
    title: `${product.name} — AfrikWholesaler`,
    description,
    alternates: { canonical: absoluteUrl(path, locale), languages: languageAlternates(path) },
    openGraph: {
      title: product.name,
      description,
      url: absoluteUrl(path, locale),
      images: product.images.slice(0, 1).map((url) => ({ url, alt: product.name })),
    },
  };
}

const AVAILABILITY: Record<string, string> = {
  "In Stock": "https://schema.org/InStock",
  "Low Stock": "https://schema.org/LimitedAvailability",
  "Out of Stock": "https://schema.org/OutOfStock",
  "Pre-Order": "https://schema.org/PreOrder",
};

/** schema.org Product, so search results can show price range, stock and rating. */
function productJsonLd(product: Product, url: string) {
  const prices = product.priceTiers.map((t) => t.price).filter((p) => p > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: summary(product),
    image: product.images.slice(0, 5),
    sku: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: "AfrikWholesaler" },
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        url,
        priceCurrency: "USD",
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: prices.length,
        availability: AVAILABILITY[product.stockStatus] ?? "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "AfrikWholesaler" },
      },
    }),
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chat?: string; ref?: string }>;
}) {
  const { slug } = await params;
  const { chat, ref } = await searchParams;
  const product = await loadProduct(slug);

  if (!product) {
    return <ProductNotFound />;
  }

  const [relatedProducts, locale] = await Promise.all([getRelatedProducts(product, 8), getLocale()]);
  // "<" is escaped so product text can never close the script tag.
  const jsonLd = JSON.stringify(productJsonLd(product, absoluteUrl(`/products/${product.slug}`, locale))).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ProductDetail
        product={product}
        relatedProducts={relatedProducts}
        initialChatOpen={chat === "1"}
        refCode={ref}
      />
    </>
  );
}
