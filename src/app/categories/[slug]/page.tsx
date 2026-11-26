import { pageMetadata } from "@/i18n/page-meta";
import { getT } from "@/i18n/server";
import { categoryName } from "@/i18n/names";
import {
  getCategoryBySlug,
  getCategories,
  getSubCategoriesByCategory,
  getProductsByCategory,
  toCard,
} from "@/lib/queries";
import { CategoryBrowser, CategoryNotFound } from "@/components/categories/category-browser";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { robots: { index: false } };
  const t = await getT();
  return pageMetadata("category", `/categories/${slug}`, { name: categoryName(t, slug, category.name) });
}

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
      products={products.map(toCard)}
      allCategories={allCategories}
    />
  );
}