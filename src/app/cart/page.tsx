import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.shop.cart.title} — AfrikWholesaler` };
}

export default function CartPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-16">
        <CartView />
      </main>
      <Footer />
    </>
  );
}
