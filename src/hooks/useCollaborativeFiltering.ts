import { Product } from "@/components/products/ProductCard";
import { CartItem } from "@/context/CartContext";
import { useMemo } from "react";

interface UserPurchaseHistory {
  userId: string;
  items: number[]; // product IDs
}

// Simulated user purchase history data
const mockPurchaseHistory: UserPurchaseHistory[] = [
  { userId: "user1", items: [1, 2] }, // Vegetables + Chicken
  { userId: "user2", items: [1, 3] }, // Vegetables + Grass
  { userId: "user3", items: [2, 3] }, // Chicken + Grass
  { userId: "user4", items: [1, 2, 3] }, // All three
  { userId: "user5", items: [1, 2] }, // Vegetables + Chicken
  { userId: "user6", items: [2, 3] }, // Chicken + Grass
];

export const useCollaborativeFiltering = (
  cartItems: CartItem[],
  allProducts: Product[]
) => {
  const recommendations = useMemo(() => {
    const MAX_RECOMMENDATIONS = 3;

    // Helper: Fisher-Yates shuffle
    const shuffle = <T>(arr: T[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Helper: read cached admin products from localStorage (sync fallback)
    const readCachedAdminProducts = (): Product[] => {
      try {
        const saved = localStorage.getItem("farmfresh_products");
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((p: any) => p.inStock)
          .map(
            (p: any) =>
              ({
                id: parseInt(p.id),
                name: p.name,
                image:
                  p.image ||
                  `https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400`,
                category: p.category,
                description: p.description,
                price: p.price,
                onSale: p.onSale || false,
                salePrice: p.salePrice,
              } as Product)
          );
      } catch (_) {
        return [];
      }
    };

    // If cart is empty (new customer), show random admin-added products
    if (cartItems.length === 0) {
      const source =
        allProducts && allProducts.length > 0
          ? allProducts
          : readCachedAdminProducts();
      if (!source || source.length === 0) return [];
      return shuffle(source).slice(0, MAX_RECOMMENDATIONS);
    }

    console.log("Generating collaborative filtering recommendations...");

    // Get current cart product IDs
    const cartProductIds = cartItems.map((item) => item.id);
    console.log("Cart product IDs:", cartProductIds);

    // Only recommend products that are present in `allProducts` (admin-added)
    const adminProductIds = new Set(allProducts.map((p) => p.id));

    // Find users who bought similar items that are also admin products
    const similarUsers = mockPurchaseHistory.filter((history) =>
      history.items.some(
        (productId) =>
          cartProductIds.includes(productId) && adminProductIds.has(productId)
      )
    );

    console.log("Similar users found:", similarUsers.length);

    // Count frequency of products bought by similar users
    const productFrequency = new Map<number, number>();

    similarUsers.forEach((user) => {
      user.items.forEach((productId) => {
        // Only count products that are admin-added and not already in cart
        if (
          !cartProductIds.includes(productId) &&
          adminProductIds.has(productId)
        ) {
          productFrequency.set(
            productId,
            (productFrequency.get(productId) || 0) + 1
          );
        }
      });
    });

    console.log(
      "Product frequency map:",
      Array.from(productFrequency.entries())
    );

    // Sort by frequency (collaborative filtering - most co-purchased first)
    const sortedRecommendations = Array.from(productFrequency.entries())
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .slice(0, 3); // Top 3 recommendations

    // Map back to product objects
    const recommendedProducts = sortedRecommendations
      .map(([productId]) => allProducts.find((p) => p.id === productId))
      .filter(Boolean) as Product[];

    console.log(
      "Final recommendations:",
      recommendedProducts.map((p) => p.name)
    );

    // If we have fewer than desired recommendations, try category-based, then random fill
    const finalRecommendations: Product[] = [];

    // Start with collaborative filtering results
    recommendedProducts.forEach((p) => finalRecommendations.push(p));

    // Helper: get candidates excluding cart items and already recommended
    const excludedIds = new Set<number>([
      ...cartProductIds,
      ...finalRecommendations.map((p) => p.id),
    ]);
    const candidates = allProducts.filter((p) => !excludedIds.has(p.id));

    // 1) Fill from same categories as cart items (preserve order)
    if (finalRecommendations.length < MAX_RECOMMENDATIONS) {
      const cartCategories = new Set(cartItems.map((i) => i.category));
      const categoryCandidates = candidates.filter((p) =>
        cartCategories.has(p.category)
      );
      for (const c of categoryCandidates) {
        if (finalRecommendations.length >= MAX_RECOMMENDATIONS) break;
        finalRecommendations.push(c);
        excludedIds.add(c.id);
      }
    }

    // 2) If still not enough, add random products from remaining candidates
    if (finalRecommendations.length < MAX_RECOMMENDATIONS) {
      const remaining = allProducts.filter((p) => !excludedIds.has(p.id));
      // Shuffle in-place (Fisher-Yates)
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      for (const r of remaining) {
        if (finalRecommendations.length >= MAX_RECOMMENDATIONS) break;
        finalRecommendations.push(r);
      }
    }

    // Limit to MAX_RECOMMENDATIONS and return
    // Ensure recommendations are admin-provided products and deduplicated
    const adminIds = new Set(allProducts.map((p) => p.id));
    const deduped: Product[] = [];
    const seen = new Set<number>();
    for (const p of finalRecommendations) {
      if (!adminIds.has(p.id)) continue; // skip non-admin products
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      deduped.push(p);
      if (deduped.length >= MAX_RECOMMENDATIONS) break;
    }

    return deduped.slice(0, MAX_RECOMMENDATIONS);
  }, [cartItems, allProducts]);

  return {
    recommendations,
    hasRecommendations: recommendations.length > 0,
  };
};
