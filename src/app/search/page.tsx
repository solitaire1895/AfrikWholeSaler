import { Suspense } from "react";
import { getCategories } from "@/lib/queries";
import { SearchResults } from "@/components/search/search-results";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = (params.q as string) || "";
  const category = (params.category as string) || "";
  const sort = (params.sort as string) || "relevance";
  const page = parseInt((params.page as string) || "1");
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  const inStock = params.inStock === "true";

  const categories = await getCategories();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" /></div>}>
          <SearchResults
            query={query}
            category={category}
            sort={sort}
            page={page}
            minPrice={minPrice}
            maxPrice={maxPrice}
            inStock={inStock}
            categories={categories}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
