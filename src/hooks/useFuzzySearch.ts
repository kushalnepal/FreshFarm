import { Product } from "@/components/products/ProductCard";
import type { IFuseOptions } from "fuse.js";
import Fuse from "fuse.js";
import { useMemo } from "react";

interface UseFuzzySearchOptions {
  threshold?: number; // 0.0 (exact) - 1.0 (very fuzzy)
  keys?: string[]; // fields to search on (e.g. ['name', 'description'])
  includeScore?: boolean; // return scores when true

  // Basic filtering options
  category?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean; // availability-ish filter (product.onSale)

  // Tuning: prefer matches in the `name` field and ignore low-quality Fuse matches
  scoreCutoff?: number; // Fuse score maximum (lower is better). Default 0.45
  preferNameMatches?: boolean; // when true, prefer items whose matched key is `name`
}

// Simple Levenshtein distance implementation
function levenshtein(a: string, b: string) {
  const al = a.length;
  const bl = b.length;
  const dp: number[][] = Array.from({ length: al + 1 }, () =>
    new Array(bl + 1).fill(0)
  );
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[al][bl];
}

export const useFuzzySearch = (
  items: Product[],
  searchQuery: string,
  options: UseFuzzySearchOptions = {}
) => {
  const searchResults = useMemo(() => {
    const applyBasicFilters = (input: Product[]) => {
      let res = input;

      // Category filter
      if (options.category) {
        const cats = Array.isArray(options.category)
          ? options.category.map((c) => c.toString())
          : [options.category.toString()];
        res = res.filter((p) => cats.includes(p.category));
      }

      // Price range filter (use salePrice when onSale)
      if (typeof options.minPrice === "number") {
        res = res.filter((p) => {
          const price =
            p.onSale && typeof p.salePrice === "number" ? p.salePrice : p.price;
          return price >= options.minPrice!;
        });
      }
      if (typeof options.maxPrice === "number") {
        res = res.filter((p) => {
          const price =
            p.onSale && typeof p.salePrice === "number" ? p.salePrice : p.price;
          return price <= options.maxPrice!;
        });
      }

      // onSale filter
      if (typeof options.onSale === "boolean") {
        res = res.filter((p) => !!p.onSale === options.onSale);
      }

      return res;
    };

    const query = searchQuery.trim();

    // Pre-filter items according to basic filters
    const filteredItems = applyBasicFilters(items);

    // Helper: safe accessors to avoid calling toLowerCase on undefined
    const getNameLower = (p: Product) =>
      p && typeof p.name === "string" ? p.name.toLowerCase() : "";
    const getDescriptionLower = (p: Product) =>
      p && typeof p.description === "string" ? p.description.toLowerCase() : "";

    // If no query, return filtered items directly
    if (!query) {
      return {
        results: filteredItems as Product[],
        resultsWithScore: undefined,
      };
    }

    // Basic substring (case-insensitive) search first to guarantee exact/substring matches
    const qLower = query.toLowerCase();

    // 1) Exact name equals query
    const exactNameMatches = filteredItems.filter(
      (p) => getNameLower(p) === qLower
    );
    if (exactNameMatches.length > 0) {
      const exactResultsWithScore = exactNameMatches.map((item) => ({
        item,
        score: 0,
      }));
      return {
        results: exactNameMatches,
        resultsWithScore: options.includeScore
          ? exactResultsWithScore
          : undefined,
      };
    }

    // 2) Whole-word match in name (e.g. searching 'carrot' matches 'baby carrot')
    const wordRegex = new RegExp(
      `\\b${qLower.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`
    );
    const wholeWordNameMatches = filteredItems.filter((p) =>
      wordRegex.test(getNameLower(p))
    );
    if (wholeWordNameMatches.length > 0) {
      const wwResultsWithScore = wholeWordNameMatches.map((item) => ({
        item,
        score: 0,
      }));
      return {
        results: wholeWordNameMatches,
        resultsWithScore: options.includeScore ? wwResultsWithScore : undefined,
      };
    }

    // 3) Substring in name
    const substringNameMatches = filteredItems.filter((p) =>
      getNameLower(p).includes(qLower)
    );
    if (substringNameMatches.length > 0) {
      const ssResultsWithScore = substringNameMatches.map((item) => ({
        item,
        score: 0,
      }));
      return {
        results: substringNameMatches,
        resultsWithScore: options.includeScore ? ssResultsWithScore : undefined,
      };
    }

    // 4) Substring in description (lower priority) - return these only if no name matches
    const substringDescMatches = filteredItems.filter((p) =>
      getDescriptionLower(p).includes(qLower)
    );
    if (substringDescMatches.length > 0) {
      const sdResultsWithScore = substringDescMatches.map((item) => ({
        item,
        score: 0.1,
      }));
      return {
        results: substringDescMatches,
        resultsWithScore: options.includeScore ? sdResultsWithScore : undefined,
      };
    }

    // If we reach here, there were no exact/whole-word/substring matches — proceed to fuzzy search

    // Prefer fuzzy on the name field first (reduce false positives)
    const nameOnlyKeys = ["name"];
    const keys = options.keys ?? ["name", "description"];

    const fuseNameOptions: IFuseOptions<Product> = {
      keys: nameOnlyKeys as any,
      threshold:
        typeof options.threshold === "number" ? options.threshold : 0.5,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
      findAllMatches: true,
    };

    const fuseName = new Fuse(filteredItems, fuseNameOptions);
    const fuseNameResults = fuseName.search(query);

    if (fuseNameResults.length > 0) {
      // Use only good name-field fuzzy matches
      const enrichedName = fuseNameResults.map((r) => ({
        item: r.item,
        score: r.score ?? 1,
        matches: (r as any).matches as any[] | undefined,
      }));
      enrichedName.sort((a, b) => a.score - b.score);
      const nameScoreCutoff =
        typeof options.scoreCutoff === "number" ? options.scoreCutoff : 0.45;
      const filteredName = enrichedName
        .filter((e) => e.score <= nameScoreCutoff)
        .slice(0, 10);
      if (filteredName.length > 0) {
        const resultsWithScore = filteredName.map((r) => ({
          item: r.item,
          score: r.score,
        }));
        return {
          results: resultsWithScore.map((r) => r.item),
          resultsWithScore: options.includeScore ? resultsWithScore : undefined,
        };
      }
      // if name-field fuzzy matches exist but are low quality, continue to full-field fuzzy below
    }

    // Full-field fuzzy fallback (original behavior)
    const fuseOptions: IFuseOptions<Product> = {
      keys,
      threshold:
        typeof options.threshold === "number" ? options.threshold : 0.6,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
      findAllMatches: true,
    };
    const fuse = new Fuse(filteredItems, fuseOptions);

    // Fuse returns an array of { item, refIndex, score, matches }
    const fuseResults = fuse.search(query);

    // Map and sort by quality (lower score = better)
    let enriched = fuseResults.map((r) => ({
      item: r.item,
      score: r.score ?? 1,
      matches: (r as any).matches as any[] | undefined,
    }));
    enriched.sort((a, b) => a.score - b.score);

    // Filter Fuse results to prefer name matches or those below scoreCutoff
    const scoreCutoff =
      typeof options.scoreCutoff === "number" ? options.scoreCutoff : 0.45;
    const preferNameMatches = options.preferNameMatches !== false; // default true

    let filteredEnriched = enriched.filter((e) => {
      // if there are matches info, check if any matched key is 'name'
      const nameMatched =
        Array.isArray(e.matches) &&
        e.matches.some((m) => String(m.key) === "name");
      if (preferNameMatches && nameMatched) return true;
      return e.score <= scoreCutoff;
    });

    // If filtering removed too many results, fall back to enriched list
    if (filteredEnriched.length === 0) {
      filteredEnriched = enriched.slice(0, 10);
    }

    let resultsWithScore = filteredEnriched.map((r) => ({
      item: r.item,
      score: r.score,
    }));
    let results = resultsWithScore.map((r) => r.item);

    // If still empty, fall back to Levenshtein distance on product names
    if (results.length === 0) {
      const q = query.toLowerCase();
      const levMatches = filteredItems
        .map((item) => ({
          item,
          dist: levenshtein(item.name.toLowerCase(), q),
        }))
        // allow up to ~34% of the longer word as edits (tunable)
        .filter(({ item, dist }) => {
          const maxAllowed = Math.max(
            1,
            Math.floor(Math.max(item.name.length, q.length) * 0.34)
          );
          return dist <= maxAllowed;
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10);

      resultsWithScore = levMatches.map(({ item, dist }) => ({
        item,
        // convert distance to a score in [0, 1] (higher is better)
        score: 1 - dist / Math.max(item.name.length, q.length),
      }));
      results = resultsWithScore.map((r) => r.item);
    }

    return {
      results,
      resultsWithScore: options.includeScore ? resultsWithScore : undefined,
    };
    // dependencies: keep stable by serializing keys array and filter fields
  }, [
    items,
    searchQuery,
    options.threshold,
    (options.keys || []).join(","),
    options.includeScore,
    // filter deps
    Array.isArray(options.category)
      ? options.category.join(",")
      : options.category,
    options.minPrice,
    options.maxPrice,
    options.onSale,
  ]);

  return {
    results: searchResults.results,
    resultsWithScore: searchResults.resultsWithScore,
  };
};
