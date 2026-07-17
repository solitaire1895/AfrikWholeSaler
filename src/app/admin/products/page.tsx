import { getProducts, getCategories, getSubCategories } from "@/lib/queries";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  const [products, categories, subCategories] = await Promise.all([
    getProducts(),
    getCategories(),
    getSubCategories(),
  ]);

  return (
    <ProductsManager
      products={products}
      categories={categories}
      subCategories={subCategories}
    />
  );
}