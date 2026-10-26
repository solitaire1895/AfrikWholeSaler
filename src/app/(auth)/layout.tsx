import Link from "next/link";
import {
  Package,
  ShieldCheck,
  Truck,
  Lock,
  ArrowLeft,
  Star,
} from "lucide-react";
import { getT } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getT();
  const L = t.auth.layout;
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand Visual (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        {/* Decorative gradients */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(214,40,40,0.25) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(244,180,0,0.15) 0%, transparent 50%)",
          }}
        />

        <div className="relative flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] gradient-primary">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Afrik<span className="text-brand">Wholesaler</span>
            </span>
          </Link>

          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              {L.title}
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              {L.lead}
            </p>

            {/* Trust Features */}
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: L.f1Title, desc: L.f1Text },
                { icon: Truck, title: L.f2Title, desc: L.f2Text },
                { icon: Lock, title: L.f3Title, desc: L.f3Text },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10">
                    <feature.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{feature.title}</p>
                    <p className="text-white/50 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-md">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="text-white/70 text-sm leading-relaxed italic">
              {L.quote}
            </p>
            <p className="mt-3 text-sm font-semibold text-white">
              Amadou Diallo
            </p>
            <p className="text-xs text-white/50">
              {L.quoteCompany}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile Logo + Back Link */}
        <div className="flex items-center justify-between gap-2 p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] gradient-primary">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy tracking-tight">
              Afrik<span className="text-brand">Wholesaler</span>
            </span>
          </Link>
          <LanguageSwitcher />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {L.home}
          </Link>
        </div>

        {/* Desktop Back Link */}
        <div className="hidden lg:flex items-center justify-end gap-2 p-6">
          <LanguageSwitcher />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {L.backHome}
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}