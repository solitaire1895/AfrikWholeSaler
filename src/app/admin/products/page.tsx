import { getProducts, getDraftProducts, getCategories, getSubCategories } from "@/lib/queries";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  const [products, drafts, categories, subCategories] = await Promise.all([
    getProducts(),
    getDraftProducts(),
    getCategories(),
    getSubCategories(),
  ]);

  return (
    <ProductsManager
      products={products}
      drafts={drafts}
      categories={categories}
      subCategories={subCategories}
    />
  );
}
