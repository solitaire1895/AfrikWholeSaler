import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FileText, Truck, XCircle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AfrikWholesaler",
  description: "Terms and conditions for using AfrikWholesaler services.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Header */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy tracking-tight">
                  Terms of Service
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-slate max-w-none space-y-8">
            {/* Intro */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">1. Acceptance of Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                By accessing or using AfrikWholesaler's website and services, you agree to be
                bound by these Terms of Service. If you do not agree with any part of these
                terms, you must not use our services. These terms apply to all visitors, users,
                and others who access or use the platform.
              </p>
            </section>

            {/* Account */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">2. Account Registration</h2>
              <p className="text-text-secondary leading-relaxed">
                To access certain features of the platform, you must register for an account.
                You agree to provide accurate, current, and complete information during
                registration and to update such information to keep it accurate. You are
                responsible for maintaining the security of your account credentials and for
                all activities that occur under your account.
              </p>
            </section>

            {/* Pricing & Orders */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">3. Pricing and Orders</h2>
              <p className="text-text-secondary leading-relaxed">
                All prices displayed on the platform are subject to change without notice.
                Bulk pricing tiers are based on quantity and are indicated on each product
                page. Quote requests are not binding orders; a formal quote issued by
                AfrikWholesaler constitutes the final pricing. Orders are confirmed only after
                acceptance and payment of any required deposit.
              </p>
            </section>

            {/* Shipping Responsibility — KEY NEW SECTION */}
            <section className="rounded-[var(--radius-lg)] border border-warning/30 bg-warning/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-warning" />
                <h2 className="text-xl font-bold text-navy">
                  4. Shipping Responsibility Disclaimer
                </h2>
              </div>
              <p className="text-text-secondary leading-relaxed mb-3">
                <strong className="text-text-primary">Important:</strong> AfrikWholesaler
                facilitates sourcing, quality inspection, and logistics coordination on behalf
                of the buyer. However, once a shipment is dispatched from the origin warehouse,
                AfrikWholesaler <strong className="text-text-primary">declines any and all responsibility</strong> for
                problems that may arise during shipping, including but not limited to:
              </p>
              <ul className="space-y-2 text-text-secondary leading-relaxed ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>Shipping delays caused by carriers, customs, weather, or force majeure events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>Loss, damage, or theft of goods during transit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>Customs clearance delays, holds, or confiscation by destination country authorities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>Incorrect or incomplete shipping addresses provided by the buyer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>Failure of third-party logistics providers or freight forwarders</span>
                </li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                By placing an order, the buyer acknowledges these risks and accepts full
                responsibility for the shipment once it leaves the origin facility. We
                recommend that buyers arrange appropriate shipping insurance through their own
                providers if desired.
              </p>
            </section>

            {/* No Refund Policy — KEY NEW SECTION */}
            <section className="rounded-[var(--radius-lg)] border border-error/30 bg-error/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-error" />
                <h2 className="text-xl font-bold text-navy">5. No Refund Policy</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mb-3">
                <strong className="text-text-primary">All sales are final.</strong> AfrikWholesaler
                does not offer refunds, returns, or exchanges under any circumstances, including:
              </p>
              <ul className="space-y-2 text-text-secondary leading-relaxed ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>Products damaged or lost during shipping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>Shipping delays or non-delivery due to customs or carrier issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>Change of mind or incorrect product selection after order confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>Minor product variations in color, size, or specification from factory production</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>Orders cancelled after production or dispatch has begun</span>
                </li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-3">
                In the rare event that a product arrives with a manufacturing defect verified
                by our quality inspection team prior to dispatch, AfrikWholesaler may, at its
                sole discretion, offer a replacement or credit toward a future order. This
                does not constitute a guarantee and is handled on a case-by-case basis.
              </p>
            </section>

            {/* Quality Inspection */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-success" />
                <h2 className="text-xl font-bold text-navy">6. Quality Inspection</h2>
              </div>
              <p className="text-text-secondary leading-relaxed">
                AfrikWholesaler conducts quality inspection on all orders before dispatch.
                This inspection covers product count, visible defects, and specification
                matching. Our quality inspection is a value-added service and does not
                guarantee that products will arrive in the same condition after shipping,
                as we are not responsible for transit conditions (see Section 4).
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">7. Intellectual Property</h2>
              <p className="text-text-secondary leading-relaxed">
                All content on this platform, including text, graphics, logos, images, and
                software, is the property of AfrikWholesaler or its content suppliers and is
                protected by intellectual property laws. You may not reproduce, distribute, or
                create derivative works from any content without prior written consent.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">8. Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                AfrikWholesaler shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of the platform or
                services, including but not limited to loss of profits, data, or business
                opportunities. Our total liability shall not exceed the amount paid by you
                for the specific order giving rise to the claim.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">9. Governing Law</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of
                Cameroon, without regard to its conflict of law provisions. Any disputes
                arising from these terms shall be resolved in the courts of Douala, Cameroon.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">10. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                AfrikWholesaler reserves the right to modify these Terms of Service at any
                time. Changes will be posted on this page with an updated revision date. Your
                continued use of the platform after changes are posted constitutes acceptance
                of the modified terms.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">11. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 space-y-1 text-text-secondary">
                <p>Email: support@afrikwholesaler.com</p>
                <p>Phone: +237 6XX XXX XXX</p>
                <p>Address: Douala, Cameroon · Shenzhen, China</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}