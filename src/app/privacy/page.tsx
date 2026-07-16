import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — AfrikWholesaler",
  description: "How AfrikWholesaler collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Header */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy tracking-tight">
                  Privacy Policy
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
          <div className="space-y-8">
            {/* Intro */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">1. Introduction</h2>
              <p className="text-text-secondary leading-relaxed">
                AfrikWholesaler ("we", "us", or "our") is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our platform and services. Please read
                this policy carefully. If you do not agree with the terms of this privacy
                policy, please do not access the platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">2. Information We Collect</h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                We may collect information about you in a variety of ways. The information we
                may collect includes:
              </p>
              <h3 className="font-semibold text-text-primary mb-2">Personal Data</h3>
              <p className="text-text-secondary leading-relaxed mb-3">
                Personally identifiable information, such as your name, email address, phone
                number, company name, and country, that you voluntarily give to us when
                registering for an account or submitting a quote request.
              </p>
              <h3 className="font-semibold text-text-primary mb-2">Derivative Data</h3>
              <p className="text-text-secondary leading-relaxed mb-3">
                Information our servers automatically collect when you access the platform,
                such as your IP address, browser type, operating system, and access times.
              </p>
              <h3 className="font-semibold text-text-primary mb-2">Financial Data</h3>
              <p className="text-text-secondary leading-relaxed">
                Financial information related to your orders, payment methods, and transaction
                history. We do not store full credit card numbers — payments are processed
                through secure third-party payment providers.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">3. How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                We use the information we collect in the following ways:
              </p>
              <ul className="space-y-2 text-text-secondary leading-relaxed ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>To create and manage your account and provide customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>To process and fulfill your orders, quote requests, and shipments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>To send you order confirmations, shipping updates, and service notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>To improve our platform, products, and services based on your feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>To detect, prevent, and address technical issues, fraud, or security violations</span>
                </li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">4. Sharing Your Information</h2>
              <p className="text-text-secondary leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to
                third parties without your consent, except in the following circumstances:
              </p>
              <ul className="space-y-2 text-text-secondary leading-relaxed ml-4 mt-3">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>With logistics partners and freight forwarders for the purpose of shipping your orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>With payment processors to complete transactions securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>When required by law, court order, or government regulation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>In connection with a business merger, acquisition, or asset sale</span>
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">5. Data Security</h2>
              <p className="text-text-secondary leading-relaxed">
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. These measures include encrypted data transmission (SSL/TLS),
                secure password hashing, and restricted access controls. However, no method
                of transmission over the Internet or electronic storage is 100% secure, and
                we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">6. Your Data Rights</h2>
              <p className="text-text-secondary leading-relaxed mb-3">
                You have the following rights regarding your personal information:
              </p>
              <ul className="space-y-2 text-text-secondary leading-relaxed ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span><strong className="text-text-primary">Access:</strong> Request a copy of the personal data we hold about you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span><strong className="text-text-primary">Correction:</strong> Request that we correct inaccurate or incomplete data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span><strong className="text-text-primary">Deletion:</strong> Request that we delete your personal data (subject to legal requirements)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span><strong className="text-text-primary">Opt-out:</strong> Unsubscribe from marketing communications at any time</span>
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">7. Cookies and Session Data</h2>
              <p className="text-text-secondary leading-relaxed">
                We use cookies and similar technologies to maintain your login session,
                remember your preferences, and analyze platform usage. Authentication cookies
                are used to keep you logged in across visits. You can control cookie settings
                through your browser, but disabling cookies may affect platform functionality.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">8. Changes to This Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We reserve the right to modify this Privacy Policy at any time. Changes will
                be posted on this page with an updated revision date. We encourage you to
                review this page periodically to stay informed about how we protect your
                information.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">9. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have questions or concerns about this Privacy Policy or our data
                practices, please contact us at:
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