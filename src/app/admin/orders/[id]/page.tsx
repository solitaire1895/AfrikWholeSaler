import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadOrderTracking } from "@/lib/tracking";
import { TrackingView } from "@/components/tracking/tracking-view";
import { StaffTrackingPanel } from "@/components/tracking/staff-tracking-panel";
import { getT } from "@/i18n/server";

export default async function AdminOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Staff see every event, internal notes included (RLS).
  const supabase = await createClient();
  const tracking = await loadOrderTracking(supabase, { id });
  if (!tracking) notFound();
  const t = await getT();
  const shipment = tracking.shipments[tracking.shipments.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> {t.tracking.staff.backToOrders}
        </Link>
        <a
          href={`/api/invoices/${tracking.orderId}?download=1`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-navy hover:bg-surface-secondary"
        >
          <Download className="h-4 w-4" />
          {tracking.paymentStatus === "paid" ? t.tracking.staff.invoice : t.tracking.staff.proforma}
        </a>
      </div>
      <StaffTrackingPanel key={shipment?.id ?? "new"} orderId={tracking.orderId} shipment={shipment} />
      <TrackingView data={tracking} mode="staff" live />
    </div>
  );
}
