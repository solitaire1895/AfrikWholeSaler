import { intlLocale, type Locale } from "./config";

/** Fills {placeholders}: format("Hello {name}", { name: "Awa" }). */
export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

/** Chooses the singular or plural template for n, then fills {n} and other vars. */
export function plural(n: number, one: string, other: string, vars: Record<string, string | number> = {}): string {
  return format(n === 1 ? one : other, { n, ...vars });
}

export function formatNumber(locale: Locale, n: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale[locale], options).format(n);
}

export function formatDate(locale: Locale, iso: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale[locale], options ?? { day: "numeric", month: "short", year: "numeric" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );
}

export function formatTime(locale: Locale, iso: string | Date) {
  return new Intl.DateTimeFormat(intlLocale[locale], { hour: "2-digit", minute: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso
  );
}

/** "5 min ago", "il y a 5 min", "hace 5 min", "5分钟前" */
export function timeAgo(locale: Locale, iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto", style: "short" });
  const abs = Math.abs(seconds);
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(seconds / 86400), "day");
  return formatDate(locale, iso, { day: "numeric", month: "short" });
}
