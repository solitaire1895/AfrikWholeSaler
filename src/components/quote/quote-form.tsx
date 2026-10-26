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
import { useT } from "@/i18n/client";
import { categoryName } from "@/i18n/names";

export function QuoteForm({
  preselectedProduct,
  categories,
}: {
  preselectedProduct: Product | null;
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get("product");
  const t = useT();
  const Q = t.quote;
  const countryLabel = (c: string) => (t.shop.countries as Record<string, string>)[c] ?? c;

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
    "Côte d'Ivoire",
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
        setError(result.error || Q.genericError);
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
              {Q.successTitle}
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              {Q.successText}
            </p>
            <div className="space-y-3">
              <ButtonLink
                href="/dashboard/quotes"
                variant="primary"
                size="md"
                className="w-full"
              >
                {Q.viewQuotes}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="secondary"
                size="md"
                className="w-full"
              >
                {Q.continueBrowsing}
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
              {Q.title}
            </h1>
            <p className="mt-2 text-text-secondary">
              {Q.lead}
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: ShieldCheck, label: Q.trust.quality },
              { icon: Truck, label: Q.trust.logistics },
              { icon: Package, label: Q.trust.sold },
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
                <p className="text-sm font-semibold text-error">{Q.error}</p>
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
                  {Q.product} <span className="text-brand">*</span>
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
                      aria-label={Q.removeProduct}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={Q.productPlaceholder}
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData({ ...formData, productName: e.target.value })
                    }
                    required
                    className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                )}
                <p className="mt-1.5 text-xs text-text-secondary">
                  {Q.productHint}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  {Q.category}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
                >
                  <option value="">{Q.categoryPlaceholder}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {categoryName(t, cat.slug, cat.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Target Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">
                    {Q.quantity} <span className="text-brand">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={Q.quantityPlaceholder}
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
                    {Q.targetPrice}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={Q.targetPricePlaceholder}
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
                  {Q.destination} <span className="text-brand">*</span>
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
                      {countryLabel(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  {Q.details}
                </label>
                <textarea
                  placeholder={Q.detailsPlaceholder}
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
                  {Q.customization}
                </label>
                <input
                  type="text"
                  placeholder={Q.customizationPlaceholder}
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
                  {Q.urgency}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "standard", ...Q.urgencies.standard },
                    { value: "express", ...Q.urgencies.express },
                    { value: "rush", ...Q.urgencies.rush },
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
                  {Q.attachments}
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
                        aria-label={Q.removeAttachment}
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
                    {Q.upload}
                  </button>
                </div>
              </div>

              {/* AI Assistant Note */}
              <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-navy/5 border border-navy/10">
                <Sparkles className="h-5 w-5 text-navy shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {Q.aiTitle}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {Q.aiText}
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
                      {Q.submitting}
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      {Q.submit}
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
                  {Q.chatInstead}
                </ButtonLink>
              </div>
            </form>
          </Card>

          {/* Info Note */}
          <p className="mt-6 text-center text-xs text-text-secondary">
            {Q.legal}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}