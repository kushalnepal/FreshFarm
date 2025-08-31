import PaymentModal from "@/components/cart/PaymentModal";
import RecommendedProducts from "@/components/cart/RecommendedProducts";
import { Layout } from "@/components/layout/Layout";
import { Product } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";
// collaborative filtering removed - using simple admin-based recommendations
import { useRecommendations } from "@/hooks/useCollaborativeFiltering";
import { api } from "@/lib/api";
import { CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // By default, do not read or use cached demo/admin products to avoid showing stale defaults.
  // If you want to enable offline caching behavior, toggle `USE_CACHE_FALLBACK` to true.
  const USE_CACHE_FALLBACK = false;

  const readCachedProducts = (): Product[] => {
    if (!USE_CACHE_FALLBACK) return [];
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
              image: p.image || "/placeholder.svg",
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

  const [allProducts, setAllProducts] = useState<Product[]>(() => []);
  // adminProducts contains only products added by admin (from localStorage)
  const [adminProducts, setAdminProducts] = useState<Product[]>(() => []);

  // Load all admin products for recommendations
  useEffect(() => {
    let mounted = true;
    const loadAdminProducts = async () => {
      try {
        const products = await api.getAdminProducts();
        if (!mounted) return;
        if (Array.isArray(products) && products.length > 0) {
          // normalize and prefix base64 images if needed
          const displayProducts: Product[] = products
            .filter((p: any) => p.inStock)
            .map((p: any) => {
              const rawImage = p.image as string | undefined;
              const image =
                rawImage && !rawImage.startsWith("data:")
                  ? `data:image/png;base64,${rawImage}`
                  : rawImage || "/placeholder.svg";

              return {
                id: parseInt(p.id),
                name: p.name,
                image,
                category: p.category,
                description: p.description,
                price: p.price,
                onSale: p.onSale || false,
                salePrice: p.salePrice,
              } as Product;
            });

          setAllProducts(displayProducts);
          setAdminProducts(displayProducts);
          // cache for quick loads / offline scenarios
          try {
            localStorage.setItem(
              "farmfresh_products",
              JSON.stringify(products)
            );
          } catch (_) {}
          return;
        }
      } catch (err) {
        // ignore and fallback to cached products
      }

      // fallback to localStorage if API failed or returned no admin products
      const saved = localStorage.getItem("farmfresh_products");
      if (saved) {
        const adminProducts = JSON.parse(saved);
        const displayProducts: Product[] = adminProducts
          .filter((product: any) => product.inStock)
          .map((product: any) => ({
            id: parseInt(product.id),
            name: product.name,
            image: product.image || "/placeholder.svg",
            category: product.category,
            description: product.description,
            price: product.price,
            onSale: product.onSale || false,
            salePrice: product.salePrice,
          }));
        if (mounted) {
          setAllProducts(displayProducts);
          setAdminProducts(displayProducts);
        }
      } else if (mounted) {
        setAllProducts([]);
        setAdminProducts([]);
      }
    };

    loadAdminProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Read browsing history (if any) from localStorage - array of product ids user viewed frequently
  const readBrowsingHistory = (): number[] => {
    try {
      const raw = localStorage.getItem("farm_browsing_history");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((id: any) => Number(id))
        .filter((n: number) => !Number.isNaN(n));
    } catch (_) {
      return [];
    }
  };

  const browsingHistory = readBrowsingHistory();

  // Read purchase history from stored orders (do not recommend items already purchased)
  const readPurchasedProductIds = (): number[] => {
    try {
      const raw = localStorage.getItem("farmfresh_orders");
      if (!raw) return [];
      const orders = JSON.parse(raw);
      if (!Array.isArray(orders)) return [];
      const ids: number[] = [];
      for (const o of orders) {
        if (!o.items || !Array.isArray(o.items)) continue;
        for (const it of o.items) {
          const nid = Number(it.id);
          if (!Number.isNaN(nid)) ids.push(nid);
        }
      }
      return Array.from(new Set(ids));
    } catch (_) {
      return [];
    }
  };

  const purchasedIds = readPurchasedProductIds();

  // Use the recommendation hook (returns 5-10 recs by default)
  const { recommendations } = useRecommendations(items, allProducts, {
    browsingHistory,
    minRecommendations: 5,
    maxRecommendations: 10,
    purchasedIds,
  });

  // Helper: Fisher-Yates shuffle
  const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Format recommendations into the shape expected by RecommendedProducts
  const formatRecs = () => {
    const recs = (recommendations || []).slice(0, 10);
    // dedupe and ensure not recommending items that are purchased (hook already filters),
    // but allow showing cartQuantity for items in cart
    const seen = new Set<number>();
    const formatted: any[] = [];
    for (const r of recs) {
      const pid = Number(r.product.id);
      if (seen.has(pid)) continue;
      seen.add(pid);
      const cartItem = items.find((it) => Number(it.id) === pid);
      formatted.push({
        product: r.product,
        reason: r.reason || "Recommended",
        score: r.score || 0,
        cartQuantity: cartItem ? cartItem.quantity : 0,
      });
      if (formatted.length >= 10) break;
    }

    // If still too few recommendations, pad with random admin products (exclude cart & purchased)
    if (formatted.length < 5) {
      const excluded = new Set(items.map((i) => Number(i.id)));
      purchasedIds.forEach((id) => excluded.add(Number(id)));
      const pool = adminProducts.filter((p) => !excluded.has(Number(p.id)));
      for (const p of pool) {
        const pid = Number(p.id);
        if (seen.has(pid)) continue;
        formatted.push({
          product: p,
          reason: "Popular",
          score: 0,
          cartQuantity: 0,
        });
        seen.add(pid);
        if (formatted.length >= 5) break;
      }
    }

    return formatted;
  };

  const displayedRecommendations = formatRecs();
  // If nothing computed but admin products exist, show 3 random admin products
  if (
    (!displayedRecommendations || displayedRecommendations.length === 0) &&
    adminProducts &&
    adminProducts.length > 0
  ) {
    const pool = adminProducts.filter(
      (p) =>
        !items.some((i) => Number(i.id) === Number(p.id)) &&
        !purchasedIds.includes(Number(p.id))
    );
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    const fallback = a
      .slice(0, 3)
      .map((p) => ({
        product: p,
        reason: "Popular",
        score: 0,
        cartQuantity: 0,
      }));
    // override displayedRecommendations with fallback
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // (we reassign the variable for rendering)
    // @ts-ignore
    displayedRecommendations.splice(
      0,
      displayedRecommendations.length,
      ...fallback
    );
  }

  // Calculate cart total
  const cartTotal = getCartTotal();
  const hasItems = items.length > 0;

  // Inline recommendations component (shows 1-2 related products under each cart item)
  const InlineRecommendations = ({ item }: { item: CartItem }) => {
    // Simple inline recommendations: pick admin products from same category not in cart
    const recs = adminProducts
      .filter((p) => p.category === item.category && p.id !== item.id)
      .slice(0, 2);
    const { addToCart } = useCart();

    if (!recs || recs.length === 0) return null;

    // Show at most 2 inline recommendations
    const shown = recs.slice(0, 2);

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm font-medium mb-2">You may also like</div>
        <div className="flex gap-3">
          {shown.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2 bg-white border rounded-md w-1/2"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                <div className="text-xs text-gray-600">NPR {p.price}</div>
              </div>
              <button
                onClick={() => addToCart(p, 1)}
                className="px-2 py-1 text-xs bg-farm-green-dark text-white rounded"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <section className="bg-farm-cream py-16 md:py-20">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Your Cart</h1>
          <p className="text-gray-600 max-w-2xl mb-8">
            Review your selected items and proceed to checkout. Cart optimized
            with greedy algorithms and hash map deduplication.
          </p>
        </div>
      </section>

      <section className="container-custom py-12 md:py-16">
        {hasItems ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Shopping Cart</h2>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-4 pb-6 border-b"
                    >
                      <div className="w-full sm:w-24 h-24">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium text-lg">{item.name}</h3>
                          <span className="text-farm-green-dark font-semibold">
                            NPR {item.price}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-1">
                          {item.description}
                        </p>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={18} />
                            </Button>

                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus size={18} />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                      {/* Inline recommendations for this cart item */}
                      <InlineRecommendations item={item} />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button variant="outline" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>NPR {cartTotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span>Free</span>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-farm-green-dark">
                        NPR {cartTotal}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-farm-green-dark hover:bg-farm-green-light"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <CreditCard className="mr-2" size={18} />
                    Proceed to Payment
                  </Button>
                </div>

                {/* Algorithm Info */}
                <div className="mt-6 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">
                    Cart Optimization
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Greedy algorithm for value efficiency</li>
                    <li>✓ Hash map deduplication (O(1) lookups)</li>
                    <li>✓ Product recommendations (admin-based)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Browse our products and add some items to your cart.
            </p>
            <Button asChild>
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        )}
      </section>

      {/* Recommended Products - always shown just below the shopping cart */}
      {displayedRecommendations && displayedRecommendations.length > 0 ? (
        <section className="container-custom py-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Recommended for you</h3>
            <RecommendedProducts products={displayedRecommendations} />
          </div>
        </section>
      ) : null}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={cartTotal}
      />
    </Layout>
  );
};

export default Cart;
