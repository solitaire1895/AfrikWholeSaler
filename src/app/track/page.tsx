import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TrackLookup } from "@/components/tracking/track-lookup";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.tracking.meta} — AfrikWholesaler`, description: t.tracking.lead };
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <TrackLookup initialOrder={order ?? ""} />
        </div>
      </main>
      <Footer />
    </>
  );
}
