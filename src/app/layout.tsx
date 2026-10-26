import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency-context";
import { CartProvider } from "@/lib/cart-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { NotificationToasts } from "@/components/notifications/notification-toasts";
import { ChatWidget } from "@/components/chat/chat-widget";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getPathname } from "@/i18n/server";
import { SITE_URL, absoluteUrl, isIndexable, languageAlternates } from "@/i18n/seo";
import { getDictionary } from "@/i18n/dictionary";
import { intlLocale } from "@/i18n/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = await getPathname();
  const t = getDictionary(locale);
  const indexable = isIndexable(path);
  return {
    metadataBase: new URL(SITE_URL),
    // Each page exists in four languages: tell search engines about all of them.
    alternates: indexable ? { canonical: absoluteUrl(path, locale), languages: languageAlternates(path) } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    title: t.layout.meta.title,
    description: t.layout.meta.description,
    keywords: [
      "B2B",
      "wholesale",
      "grossiste",
      "sourcing Chine",
      "Afrique",
      "Mobile Money",
      "AfrikWholesaler",
    ],
    openGraph: {
      title: t.layout.meta.title,
      description: t.layout.meta.description,
      type: "website",
      siteName: "AfrikWholesaler",
      locale: intlLocale[locale].replace("-", "_"),
      url: absoluteUrl(path, locale),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={intlLocale[locale]}
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <I18nProvider locale={locale} dictionary={dictionary}>
          <CurrencyProvider>
            <NotificationsProvider>
              <CartProvider>
                {children}
                <ChatWidget />
                <NotificationToasts />
              </CartProvider>
            </NotificationsProvider>
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
