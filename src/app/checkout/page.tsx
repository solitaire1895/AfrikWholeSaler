import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { getCurrentCustomer } from "@/lib/queries";
import { getWalletBalance } from "@/app/actions/affiliate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.shop.checkout.title} — AfrikWholesaler` };
}

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?redirect=${encodeURIComponent("/checkout")}`);
  const walletBalance = await getWalletBalance();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-16">
        <CheckoutForm
          walletBalance={walletBalance}
          defaults={{
            fullName: `${customer.firstName} ${customer.lastName}`.trim(),
            phone: customer.phone ?? "",
            country: customer.country ?? "",
            city: customer.city ?? "",
          }}
        />
      </main>
      <Footer />
    </>
  );
}
