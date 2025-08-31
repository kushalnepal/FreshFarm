import { Product } from "@/components/products/ProductCard";
import { CartItem } from "@/context/CartContext";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type UserHistory = { userId: string; items: number[] };

// Small simulated history for association rules
const mockPurchaseHistory: UserHistory[] = [
  { userId: "user1", items: [1, 2] },
  { userId: "user2", items: [1, 3] },
  { userId: "user3", items: [2, 3] },
  { userId: "user4", items: [1, 2, 3] },
  { userId: "user5", items: [1, 2] },
  { userId: "user6", items: [2, 3] },
];

export type Recommendation = {
  product: Product;
  reason: string; // "bought together" | "same tag" | "browsing history" | "same category"
  score: number;
};

export const useRecommendations = (
  cartItems: CartItem[],
  allProducts: Product[],
  options?: {
    browsingHistory?: number[];
    minRecommendations?: number;
    maxRecommendations?: number;
    // list of product ids the user has already purchased (should not be recommended)
    purchasedIds?: number[];
  }
) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local compute (previous logic) as fallback
  const localCompute = useMemo(() => {
    // reuse majority of prior logic but return sync array
    const MIN = options?.minRecommendations ?? 5;
    const MAX = options?.maxRecommendations ?? 10;

    const normalizeTags = (p: Product) => {
      if (!p.tags) return [] as string[];
      if (Array.isArray(p.tags))
        return p.tags.map((t) => String(t).toLowerCase());
      return String(p.tags)
        .split(/[,|;]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    };

    const productById = new Map<number, Product>();
    allProducts.forEach((p) => productById.set(Number(p.id), p));
    const cartIds = new Set(cartItems.map((i) => Number(i.id)));
    const purchasedIds = new Set(
      (options?.purchasedIds || []).map((n) => Number(n))
    );
    const recs: Recommendation[] = [];
    const seen = new Set<number>();
    const push = (id: number, reason: string, score = 0) => {
      const pid = Number(id);
      if (cartIds.has(pid) || seen.has(pid) || purchasedIds.has(pid)) return;
      const prod = productById.get(pid);
      if (!prod) return;
      seen.add(pid);
      recs.push({ product: prod, reason, score });
    };

    if (cartItems && cartItems.length > 0) {
      const freq = new Map<number, number>();
      for (const h of mockPurchaseHistory) {
        if (h.items.some((id) => cartIds.has(id))) {
          for (const id of h.items) {
            if (!cartIds.has(id)) freq.set(id, (freq.get(id) || 0) + 1);
          }
        }
      }
      Array.from(freq.entries())
        .sort(([, a], [, b]) => b - a)
        .forEach(([id, count]) => push(id, "bought together", count));

      const browsing = options?.browsingHistory ?? [];
      if (browsing.length > 0) {
        const btags = new Set<string>();
        for (const bid of browsing) {
          const bp = productById.get(Number(bid));
          if (!bp) continue;
          normalizeTags(bp).forEach((t) => btags.add(t));
        }
        if (btags.size > 0) {
          for (const p of allProducts) {
            const pid = Number(p.id);
            if (cartIds.has(pid) || seen.has(pid)) continue;
            const shared = normalizeTags(p).filter((t) => btags.has(t)).length;
            if (shared > 0) push(pid, "browsing history", shared);
          }
        }
      }

      if (recs.length < MIN) {
        const cartCategories = new Set(cartItems.map((i) => i.category));
        for (const p of allProducts) {
          const pid = Number(p.id);
          if (cartIds.has(pid) || seen.has(pid)) continue;
          if (cartCategories.has(p.category)) push(pid, "same category", 1);
          if (recs.length >= MAX) break;
        }
      }
    } else {
      const seed = options?.browsingHistory ?? [];
      const seedTags = new Set<string>();
      if (seed.length > 0) {
        for (const sid of seed) {
          const sp = productById.get(Number(sid));
          if (!sp) continue;
          normalizeTags(sp).forEach((t) => seedTags.add(t));
        }
      }

      if (seedTags.size === 0) {
        const tagFreq = new Map<string, number>();
        for (const p of allProducts)
          normalizeTags(p).forEach((t) =>
            tagFreq.set(t, (tagFreq.get(t) || 0) + 1)
          );
        Array.from(tagFreq.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .forEach(([t]) => seedTags.add(t));
      }

      const tagsArr = Array.from(seedTags);
      for (const tag of tagsArr) {
        const candidates = allProducts.filter(
          (p) =>
            normalizeTags(p).includes(tag) &&
            !cartIds.has(Number(p.id)) &&
            !seen.has(Number(p.id))
        );
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        candidates
          .slice(0, 2)
          .forEach((p) => push(Number(p.id), "same tag", 1));
        if (recs.length >= MAX) break;
      }
    }

    const reasonPriority: Record<string, number> = {
      "bought together": 4,
      "browsing history": 3,
      "same tag": 2,
      "same category": 1,
    };
    recs.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const pa = reasonPriority[a.reason] ?? 0;
      const pb = reasonPriority[b.reason] ?? 0;
      if (pb !== pa) return pb - pa;
      return a.product.name.localeCompare(b.product.name);
    });

    return recs.slice(0, Math.max(MIN, Math.min(MAX, recs.length)));
  }, [cartItems, allProducts, options]);

  useEffect(() => {
    let mounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try server recommendations only if API client exposes method
        let usedServer = false;
        if (typeof (api as any).getRecommendations === "function") {
          try {
            const payload = {
              cart: cartItems.map((i) => Number(i.id)),
              browsingHistory: options?.browsingHistory || [],
              purchased: options?.purchasedIds || [],
            };
            const res = await (api as any)
              .getRecommendations(payload)
              .catch(() => null);
            if (res && Array.isArray(res)) {
              const mapped: Recommendation[] = res
                .map((r: any) => {
                  const prod = allProducts.find(
                    (p) => Number(p.id) === Number(r.id)
                  );
                  if (!prod) return null;
                  // server may return reason/score
                  return {
                    product: prod,
                    reason: r.reason || "server",
                    score: Number(r.score) || 0,
                  } as Recommendation;
                })
                .filter(Boolean) as Recommendation[];

              if (mapped.length > 0) {
                setRecommendations(
                  mapped.slice(0, options?.maxRecommendations ?? 10)
                );
                setLoading(false);
                usedServer = true;
              }
            }
          } catch (_) {
            // ignore server errors and fallback to local compute
          }
        }

        if (!usedServer) {
          setRecommendations(localCompute);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch recommendations");
        setRecommendations(localCompute);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      mounted = false;
    };
  }, [cartItems, allProducts, options, localCompute]);

  return { recommendations, loading, error };
};
