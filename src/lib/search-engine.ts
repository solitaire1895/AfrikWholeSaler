
// ========================================================
// Instant client-side search over the compact catalog index.
// Typo-tolerant, accent-insensitive, matches any word by prefix.
// ========================================================

/** Shape served by /api/search/index (short keys keep the payload small). */
export interface SearchIndexProduct {
  id: string;
  n: string; // name
  s: string; // slug
  c: string; // category
  cs: string; // category slug
  sc: string | null; // sub-category
  img: string | null;
  p: number; // starting price (USD)
  r: number; // rating, used as a tie-breaker
}

export interface SearchIndex {
  products: SearchIndexProduct[];
  complete: boolean;
  generatedAt: string;
}

export interface ProductHit {
  product: SearchIndexProduct;
  score: number;
  /** [start, end) character ranges in the product name to highlight. */
  highlights: [number, number][];
}

export interface CategoryHit {
  name: string;
  slug: string;
  sub: string | null; // set when the hit is a sub-category
  count: number;
}

export interface SearchResults {
  products: ProductHit[];
  categories: CategoryHit[];
  total: number;
}

interface Prepared {
  product: SearchIndexProduct;
  name: string; // normalized
  nameWords: { word: string; start: number }[];
  cat: string;
  sub: string;
}

/** Lowercase, strip accents, turn punctuation into spaces. Keeps string length stable for highlighting. */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ");
}

function words(normalized: string) {
  const out: { word: string; start: number }[] = [];
  const re = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized))) out.push({ word: m[0], start: m.index });
  return out;
}

/** Damerau-Levenshtein distance with an early exit above `max`. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/** Allowed typos grow with the length of the typed word. */
function typoBudget(len: number) {
  return len >= 8 ? 2 : len >= 4 ? 1 : 0;
}

/** A query completion, Google-style: the full phrase to search for. */
export interface Completion {
  text: string;
  source: "recent" | "popular" | "catalog";
}

interface Phrase {
  text: string; // normalized, single-spaced
  weight: number; // number of products it describes
}

/** Collapse whitespace so phrases compare cleanly. */
function squash(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Builds searchable phrases from the catalog: every run of 1–3 consecutive
 * words in product names, plus category and sub-category names, weighted by
 * how many products they describe.
 */
// Words a suggestion should never end on ("joggers the", "kit for").
const DANGLING = new Set([
  "the", "a", "an", "of", "and", "for", "with", "to", "in", "on", "by", "under",
  "de", "du", "des", "la", "le", "les", "et", "pour", "avec", "en",
]);

/** Like `normalize`, but drops apostrophes so "men's" reads as "mens". */
export function phraseKey(s: string) {
  return squash(normalize(s.replace(/['’`]/g, "")));
}

function buildPhrases(items: Prepared[]): Phrase[] {
  const counts = new Map<string, number>();
  const add = (phrase: string, seen: Set<string>) => {
    if (phrase.length < 2 || phrase.length > 40 || seen.has(phrase)) return;
    seen.add(phrase);
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  };

  for (const item of items) {
    const seen = new Set<string>(); // count each phrase once per product
    const ws = phraseKey(item.product.n).split(" ").filter(Boolean);
    for (let i = 0; i < ws.length; i++) {
      // Phrases start on a real word, not a bare number, single letter or "the".
      if (/^\d+$/.test(ws[i]) || ws[i].length < 2 || DANGLING.has(ws[i])) continue;
      for (let len = 1; len <= 3 && i + len <= ws.length; len++) {
        const last = ws[i + len - 1];
        // ...and end on one: no "joggers the", no model codes like "kit 2601".
        if (DANGLING.has(last)) continue;
        if (len > 1 && /\d/.test(last) && last.length > 1) continue;
        add(ws.slice(i, i + len).join(" "), seen);
      }
    }
    if (item.product.sc) add(phraseKey(item.product.sc), seen);
    if (item.product.c) add(phraseKey(item.product.c), seen);
  }

  // Multi-word phrases seen on a single product are usually noise
  // (fragments of one long name); keep them only if they are short.
  // Phrases ending in a number ("shoes 4") must be common to count ("jordan 1").
  return [...counts]
    .filter(([text, weight]) => weight > 1 || text.split(" ").length <= 2)
    .filter(([text, weight]) => !/\d$/.test(text) || weight >= 3)
    .map(([text, weight]) => ({ text, weight }));
}

export class SearchEngine {
  private items: Prepared[];
  private phrases: Phrase[];
  readonly complete: boolean;

  constructor(index: SearchIndex) {
    this.complete = index.complete;
    this.items = index.products.map((product) => {
      const name = normalize(product.n);
      return {
        product,
        name,
        nameWords: words(name),
        cat: normalize(product.c ?? ""),
        sub: normalize(product.sc ?? ""),
      };
    });
    this.phrases = buildPhrases(this.items);
  }

  /**
   * Query completions from the catalog. Phrases that start with the query
   * come first, then phrases containing it at a word boundary
   * ("hoodie" → "men hoodie"). Falls back to typo-tolerant product names.
   */
  suggest(rawQuery: string, limit = 8): string[] {
    const q = phraseKey(rawQuery);
    if (!q) return [];

    const scored: { text: string; score: number }[] = [];
    for (const p of this.phrases) {
      let score: number;
      if (p.text.startsWith(q)) score = 1000;
      else if (p.text.includes(" " + q)) score = 500;
      else continue;
      // Popular phrases first; prefer completions a little longer than the query.
      score += Math.min(p.weight, 50) * 4 - Math.abs(p.text.length - q.length - 8) * 0.5;
      scored.push({ text: p.text, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const out = scored.slice(0, limit).map((s) => s.text);

    // Nothing matched literally: likely a typo — suggest the closest product names.
    if (out.length === 0) {
      for (const hit of this.search(rawQuery, limit).products) {
        const t = phraseKey(hit.product.n);
        if (!out.includes(t)) out.push(t);
      }
    }
    return out;
  }

  get size() {
    return this.items.length;
  }

  /** Categories with the most products — shown before the user types. */
  topCategories(limit = 5): CategoryHit[] {
    const counts = new Map<string, CategoryHit>();
    for (const { product } of this.items) {
      const hit = counts.get(product.cs);
      if (hit) hit.count++;
      else counts.set(product.cs, { name: product.c, slug: product.cs, sub: null, count: 1 });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  }

  search(rawQuery: string, limit = 6): SearchResults {
    const query = normalize(rawQuery).trim();
    const terms = words(query).map((w) => w.word);
    if (terms.length === 0) return { products: [], categories: [], total: 0 };

    const hits: ProductHit[] = [];
    const catCounts = new Map<string, CategoryHit>();

    for (const item of this.items) {
      let score = 0;
      const highlights: [number, number][] = [];
      let matchedAll = true;

      terms.forEach((term, ti) => {
        const isLast = ti === terms.length - 1;
        let best = 0;
        let bestRange: [number, number] | null = null;

        for (const { word, start } of item.nameWords) {
          if (word === term) {
            if (best < 12) { best = 12; bestRange = [start, start + word.length]; }
          } else if (word.startsWith(term)) {
            // The word being typed is usually a prefix; earlier words too.
            const s = isLast ? 10 : 8;
            if (best < s) { best = s; bestRange = [start, start + term.length]; }
          } else if (term.length >= 3 && word.includes(term)) {
            if (best < 5) {
              const at = word.indexOf(term);
              best = 5;
              bestRange = [start + at, start + at + term.length];
            }
          } else if (best < 5) {
            const budget = typoBudget(term.length);
            // Cheap pre-filter: typos rarely touch the first letters, so skip
            // words that share neither of them.
            const plausible =
              word[0] === term[0] || word[0] === term[1] || word[1] === term[0];
            if (budget > 0 && plausible) {
              // While the last word is still being typed, compare against the
              // word's prefixes too ("hodie" → "hoodie", "joger" → "joggers").
              const targets = isLast
                ? [word, word.slice(0, term.length), word.slice(0, term.length + 1)]
                : [word];
              let d = budget + 1;
              for (const t of targets) d = Math.min(d, editDistance(term, t, budget));
              if (d <= budget) {
                // Fewer edits and a longer shared start rank higher.
                let common = 0;
                while (common < term.length && term[common] === word[common]) common++;
                const s = Math.min(4.9, 4 - d * 0.5 + common * 0.3);
                if (s > best) {
                  best = s;
                  bestRange = [start, start + Math.min(word.length, term.length + 1)];
                }
              }
            }
          }
        }

        if (best === 0) {
          // Fall back to category / sub-category text.
          if (item.sub && (item.sub.startsWith(term) || item.sub.includes(" " + term))) best = 3;
          else if (item.cat.startsWith(term) || item.cat.includes(" " + term)) best = 2;
        }

        if (best === 0) matchedAll = false;
        score += best;
        if (bestRange) highlights.push(bestRange);
      });

      if (!matchedAll || score === 0) continue;

      // Whole query at the very start of the name ranks highest.
      if (item.name.trimStart().startsWith(query)) score += 15;
      // Shorter names are usually more relevant for the same match.
      score += Math.max(0, 3 - item.name.length / 30);
      // Rating as a gentle tie-breaker.
      score += item.product.r * 0.2;

      hits.push({ product: item.product, score, highlights: mergeRanges(highlights) });

      const key = item.product.cs;
      const existing = catCounts.get(key);
      if (existing) existing.count++;
      else
        catCounts.set(key, {
          name: item.product.c,
          slug: item.product.cs,
          sub: null,
          count: 1,
        });
    }

    hits.sort((a, b) => b.score - a.score);

    const categories = [...catCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { products: hits.slice(0, limit), categories, total: hits.length };
  }
}

function mergeRanges(ranges: [number, number][]) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}

// ========================================================
// Index loading — fetched once per tab, shared by every search bar,
// with a short sessionStorage cache so page loads start warm.
// ========================================================

const STORAGE_KEY = "aw-search-index-v1";
const STORAGE_TTL = 5 * 60 * 1000;
let enginePromise: Promise<SearchEngine> | null = null;

function readStored(): SearchIndex | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { at, index } = JSON.parse(raw) as { at: number; index: SearchIndex };
    return Date.now() - at < STORAGE_TTL ? index : null;
  } catch {
    return null;
  }
}

export function loadSearchEngine(): Promise<SearchEngine> {
  if (enginePromise) return enginePromise;

  const stored = typeof window !== "undefined" ? readStored() : null;
  if (stored) {
    enginePromise = Promise.resolve(new SearchEngine(stored));
    return enginePromise;
  }

  enginePromise = fetch("/api/search/index")
    .then((res) => {
      if (!res.ok) throw new Error(`Search index ${res.status}`);
      return res.json() as Promise<SearchIndex>;
    })
    .then((index) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), index }));
      } catch {
        // Storage full or blocked — the in-memory engine still works.
      }
      return new SearchEngine(index);
    })
    .catch((err) => {
      enginePromise = null; // allow a retry on next focus
      throw err;
    });

  return enginePromise;
}

// ========================================================
// Popular searches (from all customers) and search logging
// ========================================================

let popularPromise: Promise<string[]> | null = null;

/** Most common customer searches, loaded once per tab. Empty until the SQL is installed. */
export function loadPopularSearches(): Promise<string[]> {
  if (!popularPromise) {
    popularPromise = fetch("/api/search/popular")
      .then((r) => (r.ok ? r.json() : { searches: [] }))
      .then((d: { searches: { query: string }[] }) => d.searches.map((s) => s.query))
      .catch(() => []);
  }
  return popularPromise;
}

/** Terms from `list` that start with the query or contain it at a word start. */
export function matchTerms(list: string[], rawQuery: string, limit: number): string[] {
  const q = phraseKey(rawQuery);
  if (!q) return list.slice(0, limit);
  const starts: string[] = [];
  const inside: string[] = [];
  for (const term of list) {
    const k = phraseKey(term);
    if (k.startsWith(q)) starts.push(term);
    else if (k.includes(" " + q)) inside.push(term);
  }
  return [...starts, ...inside].slice(0, limit);
}

/** Fire-and-forget: record a search so it can become a popular suggestion. */
export function logSearch(q: string, results: number) {
  const body = JSON.stringify({ q: q.trim(), results });
  try {
    if (navigator.sendBeacon?.("/api/search/log", new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/search/log", { method: "POST", body, keepalive: true }).catch(() => {});
}

// ========================================================
// Recent searches (per browser)
// ========================================================

const RECENT_KEY = "aw-recent-searches";

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecentSearch(q: string) {
  const term = q.trim();
  if (!term) return;
  try {
    const next = [term, ...getRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
