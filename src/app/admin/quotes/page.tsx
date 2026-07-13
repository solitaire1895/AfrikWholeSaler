import { getAllQuotes } from "@/lib/queries";
import { QuotesManager } from "@/components/admin/quotes-manager";

export default async function AdminQuotesPage() {
  const quotes = await getAllQuotes();
  return <QuotesManager quotes={quotes} />;
}