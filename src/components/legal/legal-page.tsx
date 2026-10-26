import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

export type LegalSection = {
  title: string;
  intro?: string;
  subs?: Record<string, { h: string; p: string }>;
  items?: readonly string[];
  outro?: string;
};

type Tone = "warning" | "error" | "success";

const toneStyles: Record<Tone, { box: string; icon: string; bullet: string }> = {
  warning: { box: "rounded-[var(--radius-lg)] border border-warning/30 bg-warning/5 p-6", icon: "text-warning", bullet: "text-warning" },
  error: { box: "rounded-[var(--radius-lg)] border border-error/30 bg-error/5 p-6", icon: "text-error", bullet: "text-error" },
  success: { box: "", icon: "text-success", bullet: "text-brand" },
};

/** "**bold** rest" → <strong>bold</strong> rest */
function rich(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-text-primary">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

/** Privacy policy / terms layout; texts come from the `legal` messages. */
export async function LegalPage({
  icon: Icon,
  title,
  sections,
  highlights = {},
}: {
  icon: LucideIcon;
  title: string;
  sections: Record<string, LegalSection>;
  /** Section key → tone and icon for emphasised sections. */
  highlights?: Record<string, { tone: Tone; icon: LucideIcon }>;
}) {
  const { t, format, formatDate } = await getI18n();
  const L = t.legal.common;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy tracking-tight">{title}</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {format(L.updated, { date: formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" }) })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {Object.entries(sections).map(([key, section]) => {
              const hl = highlights[key];
              const tone = hl ? toneStyles[hl.tone] : null;
              const HlIcon = hl?.icon;
              return (
                <section key={key} className={tone?.box || undefined}>
                  {HlIcon ? (
                    <div className="flex items-center gap-2 mb-3">
                      <HlIcon className={cn("h-5 w-5", tone?.icon)} />
                      <h2 className="text-xl font-bold text-navy">{section.title}</h2>
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-navy mb-3">{section.title}</h2>
                  )}
                  {section.intro && (
                    <p className={cn("text-text-secondary leading-relaxed", (section.subs || section.items) && "mb-3")}>
                      {rich(section.intro)}
                    </p>
                  )}
                  {section.subs &&
                    Object.entries(section.subs).map(([k, sub]) => (
                      <div key={k}>
                        <h3 className="font-semibold text-text-primary mb-2">{sub.h}</h3>
                        <p className="text-text-secondary leading-relaxed mb-3">{rich(sub.p)}</p>
                      </div>
                    ))}
                  {section.items && (
                    <ul className="space-y-2 text-text-secondary leading-relaxed ml-4">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className={cn("mt-1", tone?.bullet ?? "text-brand")}>•</span>
                          <span>{rich(item)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.outro && <p className="text-text-secondary leading-relaxed mt-3">{rich(section.outro)}</p>}
                  {key === "contact" && (
                    <div className="mt-3 space-y-1 text-text-secondary">
                      <p>
                        {L.email}: support@afrikwholesaler.com
                      </p>
                      <p>{L.phone}: +237 6XX XXX XXX</p>
                      <p>
                        {L.address}: {L.addressValue}
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
