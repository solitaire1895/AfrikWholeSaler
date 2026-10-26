import { createClient } from "@/lib/supabase/server";
import { buildInvoicePdf, invoiceNumber } from "@/lib/invoice";
import { getLocale } from "@/i18n/server";
import { isLocale } from "@/i18n/config";

// GET /api/invoices/<orderId>[?download=1][&lang=fr]
// Invoice (paid orders) or proforma (unpaid) as a PDF. The user's own Supabase
// client is used, so RLS decides access: customers get only their orders,
// staff get every order.
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(product_name, quantity, unit_price, total_price)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return new Response("Not found", { status: 404 });

  const [{ data: customer }, { data: payment }] = await Promise.all([
    supabase.from("customers").select("company_name, contact_name, email, phone").eq("id", order.customer_id).maybeSingle(),
    supabase
      .from("payments")
      .select("updated_at")
      .eq("order_id", orderId)
      .eq("status", "SUCCESS")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ship = (order.shipping_address ?? null) as {
    fullName?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
  } | null;
  const paid = order.payment_status === "paid";

  const url = new URL(request.url);
  const langParam = url.searchParams.get("lang");
  const locale = isLocale(langParam) ? langParam : await getLocale();

  const pdf = await buildInvoicePdf(
    {
      orderNumber: order.order_number,
      createdAt: order.created_at,
      paidAt: payment?.updated_at ?? (paid ? order.updated_at : null),
      paid,
      awaitingPrice: Boolean(order.awaiting_price),
      currency: order.currency || "USD",
      total: Number(order.total_amount),
      walletApplied: Number(order.wallet_applied ?? 0),
      amountPaid: Number(order.amount_paid ?? 0),
      customer: {
        name: ship?.fullName || customer?.contact_name || customer?.company_name || "—",
        company: customer?.company_name,
        email: customer?.email,
        phone: ship?.phone || customer?.phone,
      },
      shipTo: ship ? { name: ship.fullName, address: ship.address, city: ship.city, country: ship.country, phone: ship.phone } : null,
      items: ((order.order_items ?? []) as { product_name: string; quantity: number; unit_price: number; total_price: number }[]).map(
        (i) => ({ name: i.product_name, quantity: i.quantity, unitPrice: Number(i.unit_price), total: Number(i.total_price) })
      ),
    },
    locale
  );

  const filename = `${invoiceNumber(order.order_number, paid)}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${url.searchParams.has("download") ? "attachment" : "inline"}; filename="${filename}"`,
      // Personal data: never cache in shared caches.
      "Cache-Control": "private, no-store",
    },
  });
}
