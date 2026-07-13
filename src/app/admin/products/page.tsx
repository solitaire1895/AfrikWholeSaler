import { getProducts, getCategories } from "@/lib/queries";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ProductsManager products={products} categories={categories} />;
}