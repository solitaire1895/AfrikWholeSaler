"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Package,
  MessageCircle,
  ShieldCheck,
  Truck,
  X,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { createQuoteRequest } from "@/app/actions/crud";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

export function QuoteForm({
  preselectedProduct,
  categories,
}: {
  preselectedProduct: Product | null;
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get("product");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    productName: preselectedProduct?.name || "",
    productSlug: preselectedProduct?.slug || "",
    productId: preselectedProduct?.id || "",
    category: preselectedProduct?.categorySlug || "",
    quantity: preselectedProduct?.moq?.toString() || "100",
    targetPrice: "",
    destinationCountry: "Senegal",
    description: "",
    customization: "",
    urgency: "standard",
  });
  const [attachments, setAttachments] = useState<string[]>([]);

  const destinations = [
    "Senegal",
    "Nigeria",
    "Cameroon",
    "Kenya",
    "Ghana",
    "Ivory Coast",
    "Tanzania",
    "Uganda",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createQuoteRequest({
        productId: formData.productId || null,
        productName: formData.productName,
        quantity: Number(formData.quantity),
        targetPrice: formData.targetPrice ? Number(formData.targetPrice) : 0,
        destinationCountry: formData.destinationCountry,
        description: formData.description || undefined,
        customization: formData.customization || undefined,
        urgency: formData.urgency,
        attachments,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    });
  };

  const addAttachment = () => {
    const name = `attachment-${attachments.length + 1}.pdf`;
    setAttachments([...attachments, name]);
  };

  const removeAttachment = (name: string) => {
    setAttachments(attachments.filter((a) => a !== name));
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-16 flex items-center justify-center px-4">
          <Card className="max-w-lg w-full p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">
              Quote Request Submitted!
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              Thank you for your request. Our sourcing team will review your
              requirements and send you a detailed quote within 24 hours. You'll
              receive a notification in your dashboard and via email.
            </p>
            <div className="space-y-3">
              <ButtonLink
                href="/dashboard/quotes"
                variant="primary"
                size="md"
                className="w-full"
              >
                View My Quote Requests
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="secondary"
                size="md"
                className="w-full"
              >
                Continue Browsing
              </ButtonLink>
            </div>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] gradient-primary mx-auto mb-4">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-navy tracking-tight">
              Request a Quote
            </h1>
            <p className="mt-2 text-text-secondary">
              Tell us what you need and our team will source it, negotiate
              pricing, and send you a detailed quote.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: ShieldCheck, label: "Quality Inspected" },
              { icon: Truck, label: "End-to-End Logistics" },
              { icon: Package, label: "Sold by AfrikWholesaler" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] border border-border bg-surface text-center"
              >
                <item.icon className="h-5 w-5 text-brand" />
                <span className="text-xs font-medium text-text-secondary">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-[var(--radius-md)] border border-error/20 bg-error/5">
              <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error">Error</p>
                <p className="text-sm text-text-secondary mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Product <span className="text-brand">*</span>
                </label>
                {preselectedProduct ? (
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-brand bg-brand-light">
                    <span className="text-sm font-medium text-text-primary">
                      {preselectedProduct.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, productName: "", productSlug: "", productId: "" })
                      }
                      className="text-text-secondary hover:text-brand"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. USB-C Chargers, Cotton T-Shirts, or describe a custom product"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData({ ...formData, productName: e.target.value })
                    }
                    required
                    className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                )}
                <p className="mt-1.5 text-xs text-text-secondary">
                  Don't see it in our catalog? Describe what you need — we source
                  custom products too.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Target Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">
                    Quantity <span className="text-brand">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                    min="1"
                    className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">
                    Target Price (USD/unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2.50"
                    value={formData.targetPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPrice: e.target.value })
                    }
                    className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Destination Country <span className="text-brand">*</span>
                </label>
                <select
                  value={formData.destinationCountry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destinationCountry: e.target.value,
                    })
                  }
                  required
                  className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
                >
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Additional Details
                </label>
                <textarea
                  placeholder="Describe specifications, colors, sizes, materials, packaging requirements, or any other details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                />
              </div>

              {/* Customization */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Customization / Private Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Custom logo, branded packaging, specific colors"
                  value={formData.customization}
                  onChange={(e) =>
                    setFormData({ ...formData, customization: e.target.value })
                  }
                  className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "standard", label: "Standard", desc: "15-30 days" },
                    { value: "express", label: "Express", desc: "10-20 days" },
                    { value: "rush", label: "Rush", desc: "7-15 days" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, urgency: opt.value })
                      }
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-[var(--radius-sm)] border-2 transition-all",
                        formData.urgency === opt.value
                          ? "border-brand bg-brand-light"
                          : "border-border bg-surface hover:border-border/80"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          formData.urgency === opt.value
                            ? "text-brand"
                            : "text-text-primary"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Attachments
                </label>
                <div className="space-y-2">
                  {attachments.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border bg-surface-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm text-text-primary">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(name)}
                        className="text-text-disabled hover:text-error"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="flex w-full items-center justify-center gap-2 p-3 rounded-[var(--radius-sm)] border-2 border-dashed border-border text-sm text-text-secondary hover:border-brand hover:text-brand transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload spec sheet or reference images
                  </button>
                </div>
              </div>

              {/* AI Assistant Note */}
              <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-navy/5 border border-navy/10">
                <Sparkles className="h-5 w-5 text-navy shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-navy">
                    AI Sourcing Assistant
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Our AI will analyze your request and provide instant
                    recommendations from our catalog. A sales representative will
                    follow up with a detailed quote within 24 hours.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand text-white text-sm font-semibold hover:bg-brand-hover shadow-[var(--shadow-button)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Submit Quote Request
                    </>
                  )}
                </button>
                <ButtonLink
                  href="/dashboard/messages"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat Instead
                </ButtonLink>
              </div>
            </form>
          </Card>

          {/* Info Note */}
          <p className="mt-6 text-center text-xs text-text-secondary">
            By submitting this request, you agree to our Terms of Service. Quote
            estimates are non-binding until confirmed by our team.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}