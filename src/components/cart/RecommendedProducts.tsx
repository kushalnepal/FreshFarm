import { Product } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Plus, ShoppingCart } from "lucide-react";

type RecItem = {
  product: Product;
  reason?: string;
  score?: number;
  cartQuantity?: number;
};

interface RecommendedProductsProps {
  products: RecItem[] | Product[];
}

const RecommendedProducts = ({ products }: RecommendedProductsProps) => {
  const { addToCart } = useCart();

  if (!products || products.length === 0) return null;

  // Use a local placeholder for products that don't have an explicit image.
  // Avoid any external Unsplash defaults.
  const placeholder = "/placeholder.svg";

  const getImageSrc = (product: Product) => {
    const img = product.image?.toString().trim();
    if (!img) return placeholder;
    // allow absolute URLs (http/https) or app-relative paths
    if (/^https?:\/\//i.test(img)) return img;
    if (img.startsWith("/")) return img;
    // otherwise treat as a relative path or filename and let the browser resolve it;
    // if it fails, onError will set the placeholder.
    return img;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="text-farm-green-dark" size={20} />
        <h3 className="text-lg font-semibold">Customers also bought</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">Personalized recommendations</p>

      <div className="space-y-4">
        {products.map((item) => {
          const product: Product = (item as any).product
            ? (item as any).product
            : (item as Product);
          const reason: string | undefined = (item as any).reason;
          const cartQuantity: number = (item as any).cartQuantity ?? 0;

          const tags = Array.isArray(product.tags)
            ? product.tags
            : product.tags
            ? String(product.tags)
                .split(/[,|;]/)
                .map((t) => t.trim())
            : [];

          return (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={getImageSrc(product)}
                  alt={product.name}
                  onError={(e) => {
                    const fallback = placeholder;
                    if (e.currentTarget.src !== fallback)
                      e.currentTarget.src = fallback;
                  }}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>

              <div className="flex-grow">
                <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                <div className="text-xs text-gray-600 line-clamp-2">
                  {product.description}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tags.join(", ")}
                </div>
                <div className="text-farm-green-dark font-semibold text-sm mt-1">
                  NPR {product.price}
                </div>
                {reason && (
                  <div className="text-xs text-gray-500 mt-1">{reason}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  In cart: {cartQuantity}
                </div>
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
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts;
