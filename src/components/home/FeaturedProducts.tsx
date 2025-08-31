import type { Product as CardProduct } from "@/components/products/ProductCard";
import { useCart } from "@/context/CartContext";
import { api, ApiError, type Product as ApiProduct } from "@/lib/api";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Small fallback featured items (match CardProduct shape)
const fallbackFeatured: CardProduct[] = [
  {
    id: 2,
    name: "Free-Range Chicken",
    image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=400",
    category: "Chicken",
    description: "Naturally raised free-range chicken without antibiotics.",
    price: 550,
  },
  {
    id: 3,
    name: "Premium Cattle Grass",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
    category: "Grass",
    description: "High-quality grass feed for healthy cattle growth.",
    price: 180,
  },
];

const mapApiToCard = (p: ApiProduct): CardProduct => {
  // Ensure numeric id: try Number, otherwise produce a stable hash from string id
  let idNum = Number(p.id);
  if (!Number.isFinite(idNum) || idNum === 0) {
    const idStr = String(p.id);
    let h = 0;
    for (let i = 0; i < idStr.length; i++) {
      h = (h << 5) - h + idStr.charCodeAt(i);
      h |= 0; // force 32-bit
    }
    idNum = Math.abs(h) || Date.now();
  }

  const tags = (p.tags || "")
    .toString()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const category = tags.length > 0 ? tags[0] : (p as any).category || "Product";
  // Ensure image is a valid src: if backend returns raw base64, prefix with data URL
  let image = "";
  if (p.image) {
    const imgStr = p.image.toString();
    image = imgStr.startsWith("data:")
      ? imgStr
      : `data:image/jpeg;base64,${imgStr}`;
  }

  return {
    id: idNum,
    name: p.name,
    image,
    category: category as string,
    description: p.description || "",
    price: p.price || 0,
  };
};

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const [featured, setFeatured] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const products = await api.getProducts();

        const featuredProducts = (products || []).filter((p) => {
          const tags = (p as any).tags || "";
          return tags
            .toString()
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .includes("featured");
        });

        if (featuredProducts.length === 0) {
          setFeatured(fallbackFeatured);
        } else {
          setFeatured(featuredProducts.map(mapApiToCard));
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
        if (err instanceof ApiError) {
          // ignore and fallback
        }
        setFeatured(fallbackFeatured);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAddToCart = (product: CardProduct, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex flex-wrap justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-xl">
              Discover our most popular farm-fresh products, harvested with care
              and delivered directly to your doorstep.
            </p>
          </div>
          <Link
            to="/products"
            className="hidden md:flex items-center text-farm-green-dark font-semibold hover:underline mt-4 md:mt-0"
          >
            View All Products
            <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center text-gray-600">
              Loading...
            </div>
          ) : (
            featured.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-56 overflow-hidden">
                  <img
                    src={
                      product.image ||
                      "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block bg-farm-cream text-farm-brown-dark rounded-full px-3 py-1 text-xs font-medium mb-3">
                    {product.category}
                  </span>
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-farm-green-dark font-semibold">
                      NPR {product.price}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-farm-brown-dark font-medium hover:underline"
                      >
                        View Details
                      </Link>
                      <button
                        className="bg-farm-green-dark text-white p-1.5 rounded-md hover:bg-farm-green-light transition-colors"
                        aria-label="Add to cart"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/products" className="btn-outline">
            View All Products
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
