import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  HeroSection,
  MobilePaymentsSection,
  StatsSection,
  WhyChooseUsSection,
  SourcingProcessSection,
  HowItWorksSection,
  FeaturedProductsSection,
  CategoriesSection,
  AffiliateSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from "@/components/sections/landing-sections";
import { getFeaturedProducts, getCategories } from "@/lib/queries";
import { getLocale } from "@/i18n/server";
import { SITE_URL, absoluteUrl } from "@/i18n/seo";

/** schema.org Organization + WebSite (with the site search box in Google). */
function siteJsonLd(searchUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AfrikWholesaler",
      url: SITE_URL,
      description: "B2B sourcing from China, delivered across Africa, paid with Mobile Money.",
      areaServed: "Africa",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AfrikWholesaler",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${searchUrl}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export default async function Home() {
  const [featuredProducts, categories, locale] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getLocale(),
  ]);
  const jsonLd = JSON.stringify(siteJsonLd(absoluteUrl("/search", locale))).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Navbar />
      <main className="flex-1 bg-cream">
        <HeroSection />
        <MobilePaymentsSection />
        <StatsSection />
        <SourcingProcessSection />
        <HowItWorksSection />
        <WhyChooseUsSection />
        <FeaturedProductsSection products={featuredProducts} />
        <CategoriesSection categories={categories} />
        <AffiliateSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}