import type { Locale } from "./config";
import { common } from "./messages/common";
import { layout } from "./messages/layout";
import { taxonomy } from "./messages/taxonomy";
import { content } from "./messages/content";
import { landing } from "./messages/landing";
import { catalog } from "./messages/catalog";
import { product } from "./messages/product";
import { shop } from "./messages/shop";
import { chat } from "./messages/chat";
import { status } from "./messages/status";
import { notify } from "./messages/notify";
import { account } from "./messages/account";
import { auth } from "./messages/auth";
import { quote } from "./messages/quote";
import { admin } from "./messages/admin";
import { adminCatalog } from "./messages/admin-catalog";
import { legal } from "./messages/legal";
import { tracking } from "./messages/tracking";

// Each namespace holds one area's texts in all four languages.
const namespaces = {
  common,
  layout,
  taxonomy,
  content,
  landing,
  catalog,
  product,
  shop,
  chat,
  status,
  notify,
  account,
  auth,
  quote,
  admin,
  adminCatalog,
  legal,
  tracking,
};

type Namespaces = typeof namespaces;
export type Dictionary = { [K in keyof Namespaces]: Namespaces[K][Locale] };

/** All texts for one language. Server-only use; clients get it via <I18nProvider>. */
export function getDictionary(locale: Locale): Dictionary {
  const out = {} as Record<string, unknown>;
  for (const [ns, messages] of Object.entries(namespaces)) out[ns] = messages[locale];
  return out as Dictionary;
}
