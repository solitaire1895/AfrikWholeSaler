import { Suspense } from "react";
import { getProducts, getCategories, getSubCategories, toCard } from "@/lib/queries";
import { ProductsBrowser } from "@/components/products/products-browser";

export default async function ProductsPage() {
  const [products, categories, subCategories] = await Promise.all([
    getProducts(),
    getCategories(),
    getSubCategories(),
  ]);

  return (
    <Suspense fallback={null}>
      <ProductsBrowser
        products={products.map(toCard)}
        categories={categories}
        subCategories={subCategories}
      />
    </Suspense>
  );
}