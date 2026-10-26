import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadOrderTracking } from "@/lib/tracking";
import { TrackingView } from "@/components/tracking/tracking-view";
import { getT } from "@/i18n/server";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // RLS: customers only get their own orders and public events.
  const supabase = await createClient();
  const tracking = await loadOrderTracking(supabase, { id }, { publicOnly: true });
  if (!tracking) notFound();
  const t = await getT();

  return (
    <div className="space-y-4">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> {t.tracking.viewOrders}
      </Link>
      <TrackingView data={tracking} mode="customer" live />
    </div>
  );
}
