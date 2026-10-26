import type { Metadata } from "next";
import { FileText, Truck, XCircle, ShieldCheck } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.legal.terms.title} — AfrikWholesaler`, description: t.legal.terms.description };
}

export default async function TermsPage() {
  const t = await getT();
  return (
    <LegalPage
      icon={FileText}
      title={t.legal.terms.title}
      sections={t.legal.terms.sections as Record<string, LegalSection>}
      highlights={{
        shipping: { tone: "warning", icon: Truck },
        refunds: { tone: "error", icon: XCircle },
        quality: { tone: "success", icon: ShieldCheck },
      }}
    />
  );
}
