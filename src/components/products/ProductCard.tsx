import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

export interface Product {
  id: number;
  name: string;
  image: string;
  category: string;
  description: string;
  price: number;
  // Optional logistics data used for delivery packing (kg, cubic centimeters)
  weightKg?: number;
  volumeCm3?: number;
  // Optional tags (backend may provide tags as array or comma-separated string)
  tags?: string[] | string;
  onSale?: boolean;
  salePrice?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const displayPrice =
    product.onSale && product.salePrice ? product.salePrice : product.price;
  const originalPrice = product.price;

  // Fallback image if no image is provided
  const defaultImage = "/placeholder.svg";

  const productImage =
    product.image && String(product.image).trim()
      ? String(product.image).trim()
      : defaultImage;

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      {/* Sale Badge */}
      {product.onSale && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            SALE
          </span>
        </div>
      )}

      <div className="h-52 overflow-hidden">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback to default image if the product image fails to load
            if (e.currentTarget.src !== defaultImage)
              e.currentTarget.src = defaultImage;
          }}
        />
      </div>

      <div className="p-5">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-farm-green-dark font-semibold">
              NPR {displayPrice}
            </span>
            {product.onSale && product.salePrice && (
              <span className="text-gray-500 line-through text-sm">
                NPR {originalPrice}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              to={`/products/${product.id}`}
              className="text-farm-brown-dark text-sm font-medium hover:underline"
            >
              Details
            </Link>
            <button
              className="bg-farm-green-dark text-white p-1.5 rounded-md hover:bg-farm-green-light transition-colors"
              aria-label="Add to cart"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
