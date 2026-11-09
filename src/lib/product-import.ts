// Bulk product import from a CSV file (safe for client and server).
// Products are created as drafts without media; adding images publishes them.

import type { Category, SubCategory, PriceTier } from "@/types";

export const IMPORT_MAX_ROWS = 500;

export const IMPORT_COLUMNS = [
  "name",
  "description",
  "category",
  "sub_category",
  "origin_country",
  "moq",
  "price",
  "stock_status",
  "stock_quantity",
  "featured",
  "delivery_days_min",
  "delivery_days_max",
] as const;
type Column = (typeof IMPORT_COLUMNS)[number];

/** Header spellings partners may use (lowercase, accents and spaces removed). */
const ALIASES: Record<string, Column> = {
  name: "name", nom: "name", nombre: "name", productname: "name",
  description: "description", descripcion: "description",
  category: "category", categorie: "category", categoria: "category",
  subcategory: "sub_category", souscategorie: "sub_category", subcategoria: "sub_category",
  origincountry: "origin_country", origin: "origin_country", paysorigine: "origin_country", pays: "origin_country", origen: "origin_country",
  moq: "moq", minimum: "moq", quantiteminimum: "moq",
  price: "price", prix: "price", precio: "price", prices: "price", pricetiers: "price",
  stockstatus: "stock_status", stock: "stock_status", disponibilite: "stock_status",
  stockquantity: "stock_quantity", quantite: "stock_quantity", quantity: "stock_quantity",
  featured: "featured", vedette: "featured", destacado: "featured",
  deliverydaysmin: "delivery_days_min", delaimin: "delivery_days_min",
  deliverydaysmax: "delivery_days_max", delaimax: "delivery_days_max",
};

const STOCK: Record<string, string> = {
  instock: "In Stock", enstock: "In Stock", disponible: "In Stock", available: "In Stock",
  lowstock: "Low Stock", stockfaible: "Low Stock", stockbajo: "Low Stock",
  outofstock: "Out of Stock", rupture: "Out of Stock", epuise: "Out of Stock", agotado: "Out of Stock",
  preorder: "Pre-Order", precommande: "Pre-Order", preventa: "Pre-Order",
};

export interface ImportRow {
  line: number;
  name: string;
  description: string;
  categoryId: string;
  subCategoryId: string | null;
  originCountry: string;
  moq: number;
  priceTiers: PriceTier[];
  stockStatus: string;
  stockQuantity: number;
  featured: boolean;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
}

export type ImportErrorCode =
  | "empty"
  | "tooMany"
  | "noNameColumn"
  | "missingName"
  | "unknownCategory"
  | "unknownSubCategory"
  | "badPrice"
  | "badNumber";

export interface ImportError {
  line: number;
  code: ImportErrorCode;
  value?: string;
}

const key = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** RFC 4180 CSV: quoted fields, "" escapes, newlines inside quotes. Detects , ; or tab. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const delimiter = [";", "\t", ","].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best
  , ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** "12.5" and "12,5" both work (Excel in French writes decimal commas). */
function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s|\$|usd/gi, "");
  if (!s) return null;
  const n = Number(s.includes(".") ? s.replace(/,/g, "") : s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Price column: one price ("12.5") or quantity tiers ("1-49:12.5 | 50-199:10 | 200+:8").
 * The first tier always starts at the MOQ, like the product form.
 */
export function parsePrice(raw: string, moq: number): PriceTier[] | null {
  const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1 && !parts[0].includes(":")) {
    const price = toNumber(parts[0]);
    return price === null ? null : [{ minQuantity: moq, maxQuantity: null, price, currency: "USD" }];
  }
  const tiers: PriceTier[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:-\s*(\d+)|\+)?\s*:\s*(.+)$/);
    if (!m) return null;
    const price = toNumber(m[3]);
    if (price === null) return null;
    tiers.push({ minQuantity: Number(m[1]), maxQuantity: m[2] ? Number(m[2]) : null, price, currency: "USD" });
  }
  tiers.sort((a, b) => a.minQuantity - b.minQuantity);
  tiers[0].minQuantity = moq;
  return tiers;
}

function findByName<T extends { slug: string; name: string }>(list: T[], value: string): T | undefined {
  const k = key(value);
  return list.find((x) => key(x.slug) === k || key(x.name) === k);
}

/** Reads the file into product rows; every problem is reported with its line number. */
export function readProductCsv(
  text: string,
  categories: Category[],
  subCategories: SubCategory[]
): { rows: ImportRow[]; errors: ImportError[] } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], errors: [{ line: 1, code: "empty" }] };
  if (table.length - 1 > IMPORT_MAX_ROWS) return { rows: [], errors: [{ line: 1, code: "tooMany", value: String(IMPORT_MAX_ROWS) }] };

  const columns = table[0].map((h) => ALIASES[key(h)]);
  if (!columns.includes("name")) return { rows: [], errors: [{ line: 1, code: "noNameColumn" }] };

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (c: Column) => (cells[columns.indexOf(c)] ?? "").trim();
    const fail = (code: ImportErrorCode, value?: string) => { errors.push({ line, code, value }); };

    const name = get("name");
    if (!name) return fail("missingName");

    const category = findByName(categories, get("category"));
    if (!category) return fail("unknownCategory", get("category"));

    let subCategoryId: string | null = null;
    if (get("sub_category")) {
      const sub = findByName(subCategories.filter((s) => s.categoryId === category.id), get("sub_category"));
      if (!sub) return fail("unknownSubCategory", get("sub_category"));
      subCategoryId = sub.id;
    }

    const int = (c: Column, fallback: number | null) => {
      const raw = get(c);
      if (!raw) return fallback;
      const n = toNumber(raw);
      if (n === null || !Number.isInteger(n)) { fail("badNumber", `${c}: ${raw}`); return undefined; }
      return n;
    };
    const moq = int("moq", 1);
    const stockQuantity = int("stock_quantity", 0);
    const dMin = int("delivery_days_min", null);
    const dMax = int("delivery_days_max", null);
    if (moq === undefined || stockQuantity === undefined || dMin === undefined || dMax === undefined) return;

    const priceTiers = parsePrice(get("price"), Math.max(1, moq ?? 1));
    if (!priceTiers) return fail("badPrice", get("price"));

    rows.push({
      line,
      name: name.slice(0, 200),
      description: get("description").slice(0, 5000),
      categoryId: category.id,
      subCategoryId,
      originCountry: get("origin_country") || "China",
      moq: Math.max(1, moq ?? 1),
      priceTiers,
      stockStatus: STOCK[key(get("stock_status"))] ?? "In Stock",
      stockQuantity: stockQuantity ?? 0,
      featured: ["yes", "oui", "si", "true", "1", "x"].includes(key(get("featured"))),
      deliveryDaysMin: dMin,
      deliveryDaysMax: dMax,
    });
  });
  return { rows, errors };
}

/** Example file partners can fill in (opens in Excel / Google Sheets). */
export function importTemplate(categories: Category[], subCategories: SubCategory[]): string {
  const cat = categories[0];
  const sub = cat ? subCategories.find((s) => s.categoryId === cat.id) : undefined;
  const quote = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const example = [
    ["Wireless earbuds X2", "Bluetooth 5.3, 30 h battery, charging case", cat?.slug ?? "electronics", sub?.slug ?? "", "China", "50", "50-199:4.5 | 200-999:3.9 | 1000+:3.2", "In Stock", "5000", "no", "15", "30"],
    ["Cotton T-shirt", "100% cotton, sizes S to XXL", cat?.slug ?? "electronics", "", "Turkey", "100", "2.8", "Pre-Order", "0", "yes", "20", "35"],
  ];
  return [IMPORT_COLUMNS.join(","), ...example.map((r) => r.map(quote).join(","))].join("\r\n") + "\r\n";
}
