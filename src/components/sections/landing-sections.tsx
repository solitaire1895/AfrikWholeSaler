"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  ShieldCheck,
  Truck,
  PackageCheck,
  FileText,
  CheckCircle,
  Sparkles,
  BadgeDollarSign,
  Headphones,
  Lock,
  Star,
  ArrowRight,
  Package,
  Globe,
  Users,
  Quote,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/product/product-card";
import { Accordion } from "@/components/ui/accordion";
import {
  testimonials,
  faqs,
  stats,
  sourcingSteps,
  howItWorksSteps,
  valueProps,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import type { Product, Category } from "@/types";

// --- Icon mapping ---
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  ShieldCheck,
  Truck,
  PackageCheck,
  FileText,
  CheckCircle,
  Sparkles,
  BadgeDollarSign,
  Headphones,
  Lock,
  Package,
  Globe,
  Users,
};

// --- Animated Counter ---
function AnimatedCounter({
  value,
  suffix,
  duration = 2000,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(value);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

// --- Section: Hero ---
export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(214,40,40,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(244,180,0,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm font-medium text-text-secondary shadow-sm mb-6">
            <Sparkles className="h-4 w-4 text-gold" />
            AI-Powered Sourcing for African Businesses
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-navy leading-tight">
            Source Quality Products from China
            <span className="block gradient-primary bg-clip-text text-transparent">
              with Total Confidence
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            AfrikWholesaler handles everything — sourcing, quality inspection,
            shipping, and delivery. You deal only with us, never with factories.
            Trusted by 3,500+ businesses across Africa.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ButtonLink href="/quote" variant="primary" size="lg">
              <FileText className="h-5 w-5" />
              Request a Quote
            </ButtonLink>
            <ButtonLink href="/products" variant="secondary" size="lg">
              Browse Catalog
              <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              Quality Inspected
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-info" />
              End-to-End Logistics
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-navy" />
              Secure Payments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Section: Stats ---
export function StatsSection() {
  return (
    <section className="py-16 bg-surface border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = iconMap[stat.icon] ?? Package;
            return (
              <div key={stat.id} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-navy">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- Section: Why Choose Us ---
export function WhyChooseUsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Why Choose AfrikWholesaler
          </h2>
          <p className="mt-4 text-text-secondary">
            We are your single sourcing partner — handling every step from
            factory to your doorstep with transparency and trust.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {valueProps.map((vp) => {
            const Icon = iconMap[vp.icon] ?? Sparkles;
            return (
              <Card key={vp.id} hover className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-text-primary text-lg mb-2">
                  {vp.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {vp.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- Section: Sourcing Process ---
export function SourcingProcessSection() {
  return (
    <section className="py-20 sm:py-28 bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Our Sourcing Process
          </h2>
          <p className="mt-4 text-text-secondary">
            From sourcing to delivery, we manage every step so you can focus on
            growing your business.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sourcingSteps.map((step, idx) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {idx < sourcingSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-border" />
                )}
                <Card className="relative p-6 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white mb-4 relative z-10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-brand mb-1">
                    STEP {idx + 1}
                  </div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- Section: How It Works ---
export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary mb-8">
              Getting started is simple. Three steps from product discovery to
              delivery at your door.
            </p>
            <div className="space-y-6">
              {howItWorksSteps.map((step, idx) => {
                const Icon = iconMap[step.icon] ?? Search;
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-navy text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand">
                          0{idx + 1}
                        </span>
                        <h3 className="font-bold text-text-primary">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <ButtonLink href="/quote" variant="primary" size="lg">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <Card className="p-8 gradient-dark text-white">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <span className="text-sm font-semibold">Sold by AfrikWholesaler</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                One Partner. Total Trust.
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Unlike marketplaces where you deal with unknown suppliers,
                AfrikWholesaler is the sole seller of record. We source, inspect,
                and deliver — you never interact with factories.
              </p>
              <div className="space-y-3">
                {[
                  "Quality inspection on every order",
                  "Transparent pricing with no hidden fees",
                  "Customs clearance handled for you",
                  "Real-time shipment tracking",
                  "Dedicated support via live chat",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gold shrink-0" />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Section: Featured Products ---
export function FeaturedProductsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-20 sm:py-28 bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
              Featured Products
            </h2>
            <p className="mt-2 text-text-secondary">
              Hand-picked products with competitive bulk pricing
            </p>
          </div>
          <ButtonLink href="/products" variant="outline" size="md">
            View All Products
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-secondary py-12">No featured products available yet.</p>
        )}
      </div>
    </section>
  );
}

// --- Section: Categories ---
export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Browse by Category
          </h2>
          <p className="mt-4 text-text-secondary">
            Explore our extensive catalog across diverse product categories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Package;
            return (
              <a
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative flex flex-col items-center justify-center p-6 bg-surface rounded-[var(--radius-card)] border border-border hover:border-brand/30 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm text-center">
                  {cat.name}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {cat.productCount} products
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// --- Section: Testimonials ---
export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Trusted by Businesses Across Africa
          </h2>
          <p className="mt-4 text-text-secondary">
            See what our customers say about working with AfrikWholesaler
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="p-6 flex flex-col">
              <Quote className="h-8 w-8 text-brand/20 mb-3" />
              <p className="text-sm text-text-secondary leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-1 mt-4 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand font-semibold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t.company} · {t.country}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Section: FAQ ---
export function FAQSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-text-secondary">
            Everything you need to know about sourcing with AfrikWholesaler
          </p>
        </div>
        <Accordion items={faqs} />
      </div>
    </section>
  );
}

// --- Section: CTA ---
export function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[var(--radius-card)] gradient-dark p-10 sm:p-16 text-center">
          {/* Decorative gradient */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(214,40,40,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(244,180,0,0.2) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to Source Smarter?
            </h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto">
              Submit a quote request today and our team will find the best
              products at the right price — with quality inspection and delivery
              handled end-to-end.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ButtonLink href="/quote" variant="primary" size="lg">
                <FileText className="h-5 w-5" />
                Request a Quote
              </ButtonLink>
              <ButtonLink href="/chat" variant="gold" size="lg">
                <Headphones className="h-5 w-5" />
                Chat with an Expert
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}