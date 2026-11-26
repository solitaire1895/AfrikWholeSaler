import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

// Titles and descriptions of the pages that had none: they used to inherit the
// homepage's, so Google took them for the homepage (a search for
// "afrikwholesaler" could land on a category page).

const TEXT = {
  en: {
    products: ["Wholesale products from China", "Browse {n}+ wholesale products sourced in China, quality-checked and delivered across Africa. Pay with Mobile Money."],
    category: ["{name} wholesale from China", "Buy {name} wholesale from China: quality-checked products delivered across Africa. Pay with Mobile Money."],
    quote: ["Request a quote", "Tell us what you need and get a sourcing quote from China, delivered across Africa."],
    search: ["Search", ""],
    login: ["Log in", ""],
    register: ["Create an account", ""],
  },
  fr: {
    products: ["Produits en gros de Chine", "Parcourez plus de {n} produits en gros sourcés en Chine, contrôlés et livrés partout en Afrique. Payez par Mobile Money."],
    category: ["{name} en gros depuis la Chine", "Achetez {name} en gros depuis la Chine : produits contrôlés, livrés partout en Afrique. Payez par Mobile Money."],
    quote: ["Demander un devis", "Dites-nous ce qu'il vous faut et recevez un devis de sourcing en Chine, livré partout en Afrique."],
    search: ["Recherche", ""],
    login: ["Connexion", ""],
    register: ["Créer un compte", ""],
  },
  es: {
    products: ["Productos al por mayor de China", "Explora más de {n} productos al por mayor de China, revisados y entregados en toda África. Paga con Mobile Money."],
    category: ["{name} al por mayor desde China", "Compra {name} al por mayor desde China: productos revisados y entregados en toda África. Paga con Mobile Money."],
    quote: ["Solicitar una cotización", "Dinos qué necesitas y recibe una cotización de abastecimiento en China, con entrega en toda África."],
    search: ["Búsqueda", ""],
    login: ["Iniciar sesión", ""],
    register: ["Crear una cuenta", ""],
  },
  zh: {
    products: ["中国批发商品", "浏览 {n}+ 件中国采购的批发商品，经过质检并配送至非洲各地。支持移动支付。"],
    category: ["{name} 中国批发", "从中国批发 {name}：经过质检，配送至非洲各地。支持移动支付。"],
    quote: ["申请报价", "告诉我们您的需求，获取中国采购报价，配送至非洲各地。"],
    search: ["搜索", ""],
    login: ["登录", ""],
    register: ["创建账户", ""],
  },
} satisfies Record<Locale, Record<string, [string, string]>>;

type Kind = keyof (typeof TEXT)["en"];

export async function pageMetadata(
  kind: Kind,
  path: string,
  vars: Record<string, string | number> = {},
  opts: { index?: boolean } = {}
): Promise<Metadata> {
  const locale = await getLocale();
  const [title, description] = TEXT[locale][kind].map((s) => format(s, vars));
  const full = `${title} — AfrikWholesaler`;
  if (opts.index === false) return { title: full, robots: { index: false, follow: true } };
  const url = absoluteUrl(path, locale);
  return {
    title: full,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: { title: full, description, url },
  };
}
