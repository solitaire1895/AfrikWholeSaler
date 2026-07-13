import { Suspense } from "react";
import { getProducts, getCategories, getSubCategories } from "@/lib/queries";
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
        products={products}
        categories={categories}
        subCategories={subCategories}
      />
    </Suspense>
  );
}