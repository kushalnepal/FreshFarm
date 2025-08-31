import PaymentModal from "@/components/cart/PaymentModal";
import RecommendedProducts from "@/components/cart/RecommendedProducts";
import { Layout } from "@/components/layout/Layout";
import { Product } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useCollaborativeFiltering } from "@/hooks/useCollaborativeFiltering";
import { api } from "@/lib/api";
import { CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // Initialize from localStorage synchronously so recommendations can show instantly
  const readCachedProducts = (): Product[] => {
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

  const [allProducts, setAllProducts] = useState<Product[]>(() =>
    readCachedProducts()
  );
  // adminProducts contains only products added by admin (from localStorage)
  const [adminProducts, setAdminProducts] = useState<Product[]>(() =>
    readCachedProducts()
  );

  // Load all products for collaborative filtering
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
                  : rawImage ||
                    `https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400`;

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
            image:
              product.image ||
              `https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400`,
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

  // Get collaborative filtering recommendations (may be empty initially)
  const { recommendations } = useCollaborativeFiltering(items, adminProducts);

  // Only consider recommendations that are admin-provided
  const adminRecommendations =
    adminProducts && adminProducts.length > 0
      ? recommendations.filter((rec) =>
          adminProducts.some((p) => p.id === rec.id)
        )
      : [];

  // Helper: Fisher-Yates shuffle
  const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Ensure we display at least 3 recommendations. For new visitors (empty cart), show 3 random admin products.
  const getDisplayedRecommendations = () => {
    const MAX = 3;
    // Start from collaborative results (adminRecommendations)
    const base = adminRecommendations.slice();

    // If user is new (no items), ignore collaborative results and return 3 random admin products
    if (items.length === 0) {
      if (!adminProducts || adminProducts.length === 0) return [];
      return shuffle(adminProducts).slice(0, MAX);
    }

    // For users with items, pad collaborative recommendations with random admin products (excluding cart items)
    const excluded = new Set(items.map((i) => i.id));
    const chosen = base.slice();
    if (chosen.length >= MAX) return chosen.slice(0, MAX);

    const pool = adminProducts.filter(
      (p) => !excluded.has(p.id) && !chosen.some((c) => c.id === p.id)
    );
    const shuffled = shuffle(pool);
    for (const p of shuffled) {
      if (chosen.length >= MAX) break;
      chosen.push(p);
    }
    return chosen.slice(0, MAX);
  };

  const displayedRecommendations = getDisplayedRecommendations();

  // If no admin-based recommendations, fall back to 3 random products from allProducts
  const fallbackRecommendations = (() => {
    const MAX = 3;
    if (displayedRecommendations && displayedRecommendations.length > 0)
      return displayedRecommendations;
    if (!allProducts || allProducts.length === 0) return [] as Product[];
    // exclude cart items
    const excluded = new Set(items.map((i) => i.id));
    const pool = allProducts.filter((p) => !excluded.has(p.id));
    // shuffle pool
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, MAX);
  })();

  // Calculate cart total
  const cartTotal = getCartTotal();
  const hasItems = items.length > 0;

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
                    <li>✓ Collaborative filtering recommendations</li>
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
      {(displayedRecommendations && displayedRecommendations.length > 0) ||
      (fallbackRecommendations && fallbackRecommendations.length > 0) ? (
        <section className="container-custom py-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Recommended for you</h3>
            <RecommendedProducts
              products={
                displayedRecommendations && displayedRecommendations.length > 0
                  ? displayedRecommendations
                  : fallbackRecommendations
              }
            />
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
