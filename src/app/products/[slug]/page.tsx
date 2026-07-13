import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductDetail, ProductNotFound } from "@/components/products/product-detail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return <ProductNotFound />;
  }

  const relatedProducts = await getRelatedProducts(product, 4);

  return (
    <ProductDetail product={product} relatedProducts={relatedProducts} />
  );
}