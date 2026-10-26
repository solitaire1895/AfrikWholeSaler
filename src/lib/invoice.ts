import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Locale } from "@/i18n/config";

// ========================================================
// PDF invoices (paid orders) and proforma invoices (unpaid orders).
// Built with the PDF standard fonts (Latin scripts only): Chinese-speaking
// customers receive the English version.
// ========================================================

/** Seller details printed on every invoice — override with INVOICE_* env variables. */
const SELLER = {
  name: process.env.INVOICE_COMPANY_NAME || "AfrikWholesaler",
  lines: (process.env.INVOICE_COMPANY_ADDRESS || "Douala, Cameroun|Shenzhen, China").split("|"),
  email: process.env.INVOICE_COMPANY_EMAIL || "support@afrikwholesaler.store",
  phone: process.env.INVOICE_COMPANY_PHONE || "",
  taxId: process.env.INVOICE_COMPANY_TAX_ID || "",
};

type InvoiceLang = "fr" | "en" | "es";

const TEXT: Record<InvoiceLang, Record<string, string>> = {
  en: {
    invoice: "INVOICE",
    proforma: "PROFORMA INVOICE",
    number: "Invoice no.",
    order: "Order",
    date: "Date",
    billedTo: "Billed to",
    shipTo: "Ship to",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit price",
    amount: "Amount",
    subtotal: "Subtotal",
    wallet: "Affiliate balance used",
    total: "Total",
    paid: "PAID",
    unpaid: "AWAITING PAYMENT",
    depositPaid: "DEPOSIT PAID",
    amountPaid: "Already paid",
    balanceDue: "Balance due",
    depositNote: "30% deposit received. The balance is due before your goods are shipped.",
    onRequest: "On request",
    priceNote: "Some prices are on request: this proforma will be updated once our team confirms them.",
    proformaNote: "This proforma invoice is not a request for payment of taxes. Prices are valid for 7 days.",
    paidNote: "Thank you for your business. Payment received in full.",
    taxId: "Tax ID",
    page: "Page",
  },
  fr: {
    invoice: "FACTURE",
    proforma: "FACTURE PROFORMA",
    number: "Facture n°",
    order: "Commande",
    date: "Date",
    billedTo: "Facturé à",
    shipTo: "Livré à",
    description: "Désignation",
    qty: "Qté",
    unitPrice: "Prix unitaire",
    amount: "Montant",
    subtotal: "Sous-total",
    wallet: "Solde d'affilié utilisé",
    total: "Total",
    paid: "PAYÉE",
    unpaid: "EN ATTENTE DE PAIEMENT",
    depositPaid: "ACOMPTE PAYÉ",
    amountPaid: "Déjà payé",
    balanceDue: "Solde à payer",
    depositNote: "Acompte de 30 % reçu. Le solde est à régler avant l'expédition de vos marchandises.",
    onRequest: "Sur devis",
    priceNote: "Certains prix sont sur devis : cette proforma sera mise à jour après confirmation par notre équipe.",
    proformaNote: "Cette facture proforma n'est pas une demande de paiement de taxes. Prix valables 7 jours.",
    paidNote: "Merci pour votre confiance. Paiement reçu intégralement.",
    taxId: "N° contribuable",
    page: "Page",
  },
  es: {
    invoice: "FACTURA",
    proforma: "FACTURA PROFORMA",
    number: "Factura n.º",
    order: "Pedido",
    date: "Fecha",
    billedTo: "Facturado a",
    shipTo: "Enviar a",
    description: "Descripción",
    qty: "Cant.",
    unitPrice: "Precio unitario",
    amount: "Importe",
    subtotal: "Subtotal",
    wallet: "Saldo de afiliado usado",
    total: "Total",
    paid: "PAGADA",
    unpaid: "PENDIENTE DE PAGO",
    depositPaid: "ANTICIPO PAGADO",
    amountPaid: "Ya pagado",
    balanceDue: "Saldo pendiente",
    depositNote: "Anticipo del 30 % recibido. El saldo debe pagarse antes del envío de la mercancía.",
    onRequest: "A consultar",
    priceNote: "Algunos precios están a consultar: esta proforma se actualizará cuando nuestro equipo los confirme.",
    proformaNote: "Esta factura proforma no es una solicitud de pago de impuestos. Precios válidos durante 7 días.",
    paidNote: "Gracias por su confianza. Pago recibido en su totalidad.",
    taxId: "NIF",
    page: "Página",
  },
};

export interface InvoiceData {
  orderNumber: string;
  createdAt: string;
  paidAt: string | null;
  paid: boolean;
  awaitingPrice: boolean;
  currency: string;
  total: number;
  walletApplied: number;
  /** Paid through SasPay so far (a deposit when the order isn't fully paid). */
  amountPaid?: number;
  customer: { name: string; company?: string | null; email?: string | null; phone?: string | null };
  shipTo: { name?: string; address?: string; city?: string; country?: string; phone?: string } | null;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
}

const NAVY = rgb(15 / 255, 23 / 255, 42 / 255);
const BRAND = rgb(214 / 255, 40 / 255, 40 / 255);
const GOLD = rgb(244 / 255, 180 / 255, 0);
const MUTED = rgb(100 / 255, 116 / 255, 139 / 255);
const BORDER = rgb(226 / 255, 232 / 255, 240 / 255);
const CREAM = rgb(244 / 255, 242 / 255, 239 / 255);
const SUCCESS = rgb(22 / 255, 163 / 255, 74 / 255);

const LOCALE_TAG: Record<InvoiceLang, string> = { en: "en-US", fr: "fr-FR", es: "es-ES" };

export function invoiceLang(locale: Locale | string | null | undefined): InvoiceLang {
  return locale === "fr" || locale === "es" ? locale : locale === "en" || locale === "zh" ? "en" : "fr";
}

/** Invoice number derived from the order: AW-2026-000123 → INV-2026-000123 (PRO- for proforma). */
export function invoiceNumber(orderNumber: string, paid: boolean) {
  return orderNumber.replace(/^AW-/, paid ? "INV-" : "PRO-");
}

export async function buildInvoicePdf(data: InvoiceData, locale: Locale | string): Promise<Uint8Array> {
  const lang = invoiceLang(locale);
  const t = TEXT[lang];
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`${data.paid ? t.invoice : t.proforma} ${invoiceNumber(data.orderNumber, data.paid)}`);
  pdf.setAuthor(SELLER.name);
  pdf.setCreator(SELLER.name);

  // Characters the standard fonts can't draw (e.g. Chinese product names) become "?".
  const supported = new Map<string, boolean>();
  const clean = (font: PDFFont, text: string) =>
    Array.from(text.replace(/\s+/g, " "))
      .map((ch) => {
        if (!supported.has(ch)) {
          try {
            font.encodeText(ch);
            supported.set(ch, true);
          } catch {
            supported.set(ch, false);
          }
        }
        return supported.get(ch) ? ch : "?";
      })
      .join("");

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(LOCALE_TAG[lang], { style: "currency", currency: data.currency }).format(n).replace(/ | /g, " ");
    } catch {
      return `${n.toFixed(2)} ${data.currency}`;
    }
  };
  const date = (iso: string) =>
    new Intl.DateTimeFormat(LOCALE_TAG[lang], { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));

  const W = 595.28; // A4
  const H = 841.89;
  const M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, yy: number, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.font ?? regular;
    page.drawText(clean(font, s), { x, y: yy, size: opts.size ?? 10, font, color: opts.color ?? NAVY });
  };
  const right = (s: string, xRight: number, yy: number, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    const c = clean(font, s);
    page.drawText(c, { x: xRight - font.widthOfTextAtSize(c, size), y: yy, size, font, color: opts.color ?? NAVY });
  };
  /** Wraps text to `width`, returns the lines. */
  const wrap = (s: string, font: PDFFont, size: number, width: number) => {
    const words = clean(font, s).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };

  // ---- Header band
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: NAVY });
  page.drawText("Afrik", { x: M, y: H - 58, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Wholesaler", { x: M + bold.widthOfTextAtSize("Afrik", 22), y: H - 58, size: 22, font: bold, color: GOLD });
  page.drawText(clean(regular, SELLER.lines.join("  ·  ")), { x: M, y: H - 78, size: 9, font: regular, color: rgb(1, 1, 1) });
  right(data.paid ? t.invoice : t.proforma, W - M, H - 58, { font: bold, size: 16, color: rgb(1, 1, 1) });
  right(invoiceNumber(data.orderNumber, data.paid), W - M, H - 78, { size: 10, color: GOLD });
  y = H - 130;

  // ---- Status stamp + meta
  const deposit = !data.paid && (data.amountPaid ?? 0) > 0;
  const stamp = data.paid ? t.paid : deposit ? t.depositPaid : t.unpaid;
  const stampW = bold.widthOfTextAtSize(stamp, 10) + 20;
  page.drawRectangle({ x: M, y: y - 6, width: stampW, height: 22, color: data.paid ? SUCCESS : deposit ? GOLD : BRAND });
  text(stamp, M + 10, y + 1, { font: bold, size: 10, color: rgb(1, 1, 1) });

  const meta: [string, string][] = [
    [t.number, invoiceNumber(data.orderNumber, data.paid)],
    [t.order, data.orderNumber],
    [t.date, date(data.paid && data.paidAt ? data.paidAt : data.createdAt)],
  ];
  let my = y + 8;
  for (const [label, value] of meta) {
    right(label, W - M - 130, my, { color: MUTED, size: 9 });
    right(value, W - M, my, { font: bold, size: 9 });
    my -= 14;
  }
  y -= 56;

  // ---- Seller / billed to / ship to
  const colW = (W - 2 * M) / 3;
  const block = (title: string, lines: (string | null | undefined)[], x: number) => {
    text(title.toUpperCase(), x, y, { font: bold, size: 8, color: MUTED });
    let ly = y - 15;
    for (const l of lines.filter(Boolean) as string[]) {
      for (const w of wrap(l, regular, 9.5, colW - 12)) {
        text(w, x, ly, { size: 9.5 });
        ly -= 13;
      }
    }
    return ly;
  };
  const endA = block(SELLER.name, [...SELLER.lines, SELLER.email, SELLER.phone, SELLER.taxId ? `${t.taxId}: ${SELLER.taxId}` : null], M);
  const endB = block(t.billedTo, [data.customer.name, data.customer.company, data.customer.email, data.customer.phone], M + colW);
  const ship = data.shipTo;
  const endC = ship
    ? block(t.shipTo, [ship.name, ship.address, [ship.city, ship.country].filter(Boolean).join(", "), ship.phone], M + 2 * colW)
    : y;
  y = Math.min(endA, endB, endC) - 18;

  // ---- Items table
  const cols = { desc: M + 10, qty: W - M - 210, unit: W - M - 100, amount: W - M - 10 };
  const header = () => {
    page.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 24, color: CREAM });
    text(t.description, cols.desc, y, { font: bold, size: 9 });
    right(t.qty, cols.qty, y, { font: bold, size: 9 });
    right(t.unitPrice, cols.unit, y, { font: bold, size: 9 });
    right(t.amount, cols.amount, y, { font: bold, size: 9 });
    y -= 26;
  };
  header();

  let pageNo = 1;
  const footer = () => {
    right(`${t.page} ${pageNo}`, W - M, 28, { size: 8, color: MUTED });
    text(`${SELLER.name} · ${SELLER.email}`, M, 28, { size: 8, color: MUTED });
  };

  let subtotal = 0;
  for (const item of data.items) {
    const lines = wrap(item.name, regular, 9.5, cols.qty - cols.desc - 40);
    const rowH = Math.max(1, lines.length) * 13 + 10;
    if (y - rowH < 150) {
      footer();
      page = pdf.addPage([W, H]);
      pageNo++;
      y = H - M;
      header();
    }
    lines.forEach((l, i) => text(l, cols.desc, y - i * 13, { size: 9.5 }));
    right(String(item.quantity), cols.qty, y, { size: 9.5 });
    right(item.unitPrice > 0 ? money(item.unitPrice) : t.onRequest, cols.unit, y, { size: 9.5, color: item.unitPrice > 0 ? NAVY : MUTED });
    right(item.total > 0 ? money(item.total) : t.onRequest, cols.amount, y, { size: 9.5, color: item.total > 0 ? NAVY : MUTED });
    subtotal += item.total;
    y -= rowH;
    page.drawLine({ start: { x: M, y: y + 13 }, end: { x: W - M, y: y + 13 }, thickness: 0.5, color: BORDER });
  }

  // ---- Totals
  y -= 10;
  const totalLine = (label: string, value: string, strong = false) => {
    right(label, cols.unit, y, { font: strong ? bold : regular, size: strong ? 12 : 10, color: strong ? NAVY : MUTED });
    right(value, cols.amount, y, { font: strong ? bold : regular, size: strong ? 12 : 10 });
    y -= strong ? 20 : 16;
  };
  const orderTotal = data.total > 0 ? data.total : subtotal;
  totalLine(t.subtotal, data.awaitingPrice ? t.onRequest : money(orderTotal));
  if (data.walletApplied > 0) totalLine(t.wallet, `- ${money(data.walletApplied)}`);
  y -= 4;
  page.drawLine({ start: { x: cols.unit - 120, y: y + 14 }, end: { x: W - M, y: y + 14 }, thickness: 1, color: NAVY });
  totalLine(t.total, data.awaitingPrice ? t.onRequest : money(Math.max(0, orderTotal - data.walletApplied)), true);
  if (deposit) {
    totalLine(t.amountPaid, `- ${money(data.amountPaid ?? 0)}`);
    totalLine(t.balanceDue, money(Math.max(0, orderTotal - data.walletApplied - (data.amountPaid ?? 0))), true);
  }

  // ---- Notes
  y -= 16;
  const notes = [data.paid ? t.paidNote : deposit ? t.depositNote : t.proformaNote, data.awaitingPrice ? t.priceNote : null].filter(Boolean) as string[];
  for (const n of notes) {
    for (const l of wrap(n, regular, 9, W - 2 * M)) {
      text(l, M, y, { size: 9, color: MUTED });
      y -= 13;
    }
    y -= 4;
  }

  page.drawRectangle({ x: 0, y: 0, width: W, height: 4, color: BRAND });
  footer();
  return pdf.save();
}
