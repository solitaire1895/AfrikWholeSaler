import {
  getCategoryBySlug,
  getCategories,
  getSubCategoriesByCategory,
  getProductsByCategory,
} from "@/lib/queries";
import { CategoryBrowser, CategoryNotFound } from "@/components/categories/category-browser";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return <CategoryNotFound />;
  }

  const [subCategories, products, allCategories] = await Promise.all([
    getSubCategoriesByCategory(slug),
    getProductsByCategory(slug),
    getCategories(),
  ]);

  return (
    <CategoryBrowser
      category={category}
      subCategories={subCategories}
      products={products}
      allCategories={allCategories}
    />
  );
}