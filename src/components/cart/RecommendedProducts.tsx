import { Product } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Plus, ShoppingCart } from "lucide-react";

interface RecommendedProductsProps {
  products: Product[];
}

const RecommendedProducts = ({ products }: RecommendedProductsProps) => {
  const { addToCart } = useCart();

  if (products.length === 0) {
    return null;
  }

  // Name -> image mapping fallback to ensure correct images for recommendations
  const imageFallback: Record<string, string> = {
    "Organic Tomatoes":
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400",
    "Organic Potatoes":
      "https://images.unsplash.com/photo-1502741126161-b048400d72f2?w=400",
  };

  const defaultImage =
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400";

  const findFallbackByName = (productName: string) => {
    const lower = productName.toLowerCase();
    // try exact key match first
    if (imageFallback[productName]) return imageFallback[productName];
    // then try case-insensitive exact
    const exactKey = Object.keys(imageFallback).find(
      (k) => k.toLowerCase() === lower
    );
    if (exactKey) return imageFallback[exactKey];
    // then try partial match (e.g. product name contains mapping key or vice-versa)
    const partialKey = Object.keys(imageFallback).find(
      (k) => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
    );
    if (partialKey) return imageFallback[partialKey];
    return undefined;
  };

  const getImageSrc = (product: Product) => {
    const img = product.image?.toString().trim();
    // if product.image looks like a valid URL, use it
    if (img) {
      if (/^https?:\/\//i.test(img)) return img;
      // if it's a relative path, return as-is (browser will resolve)
      if (img.startsWith("/")) return img;
      // otherwise still try to use it (onError will fallback)
      return img;
    }
    // fallback to mapping or default
    const byName = findFallbackByName(product.name || "");
    return byName || defaultImage;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="text-farm-green-dark" size={20} />
        <h3 className="text-lg font-semibold">Customers also bought</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Based on collaborative filtering from similar purchases
      </p>

      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="w-16 h-16 flex-shrink-0">
              <img
                src={getImageSrc(product)}
                alt={product.name}
                onError={(e) => {
                  const fallback =
                    findFallbackByName(product.name) || defaultImage;
                  if (e.currentTarget.src !== fallback)
                    e.currentTarget.src = fallback;
                }}
                className="w-full h-full object-cover rounded-md"
              />
            </div>

            <div className="flex-grow">
              <h4 className="font-medium text-sm mb-1">{product.name}</h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                {product.description}
              </p>
              <span className="text-farm-green-dark font-semibold text-sm">
                NPR {product.price}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => addToCart(product, 1)}
              className="flex-shrink-0"
            >
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProducts;
