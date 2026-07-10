import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AfrikWholesaler — B2B Sourcing & Wholesale Platform for Africa",
  description:
    "Source quality products from China with confidence. AfrikWholesaler handles sourcing, quality control, logistics, and delivery to businesses across Africa.",
  keywords: [
    "B2B wholesale",
    "sourcing from China",
    "Africa import",
    "bulk products",
    "AfrikWholesaler",
  ],
  openGraph: {
    title: "AfrikWholesaler — B2B Sourcing & Wholesale Platform for Africa",
    description:
      "Source quality products from China with confidence. We handle sourcing, QC, logistics, and delivery to businesses across Africa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}