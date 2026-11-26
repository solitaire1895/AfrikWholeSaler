import { pageMetadata } from "@/i18n/page-meta";
import { Suspense } from "react";
import { getProductBySlug, getCategories } from "@/lib/queries";
import { QuoteForm } from "@/components/quote/quote-form";

export async function generateMetadata() {
  return pageMetadata("quote", "/quote");
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productSlug } = await searchParams;

  const [preselectedProduct, categories] = await Promise.all([
    productSlug ? getProductBySlug(productSlug) : Promise.resolve(null),
    getCategories(),
  ]);

  return (
    <Suspense fallback={null}>
      <QuoteForm
        preselectedProduct={preselectedProduct}
        categories={categories}
      />
    </Suspense>
  );
}