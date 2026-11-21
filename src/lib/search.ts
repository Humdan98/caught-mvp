// Pure search logic shared by the storefront (client) and tests.

export type Searchable = {
  id: string;
  number: number;
  name: string;
  description: string;
};

export type SearchResult<T> = {
  /** Product whose number matches the query exactly, if any. */
  exact: T | null;
  /** All matches, exact match first. */
  results: T[];
};

/** "#47", "47", " # 47 " → 47. Returns null when the query isn't a number. */
export function parseProductNumber(query: string): number | null {
  const m = query.trim().match(/^#?\s*(\d{1,6})$/);
  return m ? Number(m[1]) : null;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchProducts<T extends Searchable>(products: T[], rawQuery: string): SearchResult<T> {
  const query = rawQuery.trim();
  if (!query) return { exact: null, results: [] };

  const number = parseProductNumber(query);
  if (number !== null) {
    const exact = products.find((p) => p.number === number) ?? null;
    // Numbers also partially match names like "Vitamin C 20%".
    const others = products.filter((p) => p !== exact && normalize(p.name).includes(String(number)));
    return { exact, results: exact ? [exact, ...others] : others };
  }

  const terms = normalize(query).replace(/#/g, " ").split(" ").filter(Boolean);
  if (terms.length === 0) return { exact: null, results: [] };
  const scored = products
    .map((p) => {
      const name = normalize(p.name);
      const desc = normalize(p.description);
      let score = 0;
      for (const t of terms) {
        if (name.startsWith(t)) score += 4;
        else if (name.split(" ").some((w) => w.startsWith(t))) score += 3;
        else if (name.includes(t)) score += 2;
        else if (desc.includes(t)) score += 1;
        else return { p, score: -1 }; // every term must match somewhere
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.number - b.p.number);

  return { exact: null, results: scored.map((x) => x.p) };
}
