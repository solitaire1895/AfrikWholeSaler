import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  HeroSection,
  StatsSection,
  WhyChooseUsSection,
  SourcingProcessSection,
  HowItWorksSection,
  FeaturedProductsSection,
  CategoriesSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from "@/components/sections/landing-sections";
import { getFeaturedProducts, getCategories } from "@/lib/queries";

export default async function Home() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <WhyChooseUsSection />
        <SourcingProcessSection />
        <HowItWorksSection />
        <FeaturedProductsSection products={featuredProducts} />
        <CategoriesSection categories={categories} />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}