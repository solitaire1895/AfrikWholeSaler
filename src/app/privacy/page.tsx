import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.legal.privacy.title} — AfrikWholesaler`, description: t.legal.privacy.description };
}

export default async function PrivacyPage() {
  const t = await getT();
  return (
    <LegalPage
      icon={Lock}
      title={t.legal.privacy.title}
      sections={t.legal.privacy.sections as Record<string, LegalSection>}
    />
  );
}
