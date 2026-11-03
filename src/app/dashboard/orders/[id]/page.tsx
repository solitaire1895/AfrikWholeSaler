import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadOrderTracking } from "@/lib/tracking";
import { TrackingView } from "@/components/tracking/tracking-view";
import { getT } from "@/i18n/server";
import { Card } from "@/components/ui/card";
import { DEPOSIT_THRESHOLD_USD } from "@/lib/deposit";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // RLS: customers only get their own orders and public events.
  const supabase = await createClient();
  const tracking = await loadOrderTracking(supabase, { id }, { publicOnly: true });
  if (!tracking) notFound();
  const t = await getT();

  // Tracking opens once the order (or its 30% deposit) is paid.
  const paid = ["paid", "partial"].includes(tracking.paymentStatus);
  if (!paid) {
    const O = t.account.orders;
    return (
      <div className="space-y-4">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> {t.tracking.viewOrders}
        </Link>
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-secondary">
            <Lock className="h-5 w-5" />
          </div>
          <p className="font-semibold text-navy">{tracking.orderNumber}</p>
          <p className="max-w-sm text-sm text-text-secondary">
            {tracking.totalAmount >= DEPOSIT_THRESHOLD_USD ? O.trackingLockedDeposit : O.trackingLocked}
          </p>
          <Link href="/dashboard/orders" className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
            {O.payButton}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> {t.tracking.viewOrders}
      </Link>
      <TrackingView data={tracking} mode="customer" live />
    </div>
  );
}
