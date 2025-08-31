import { Product } from "@/components/products/ProductCard";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("farm_cart");
      if (saved) {
        const parsed = JSON.parse(saved) as any[];
        const normalized = parsed.map((it: any) => ({
          ...it,
          id: Number(it.id),
          quantity:
            typeof it.quantity === "number"
              ? it.quantity
              : Number(it.quantity) || 1,
        }));
        setItems(normalized);
      }
    } catch (err) {
      console.warn("Failed to load cart from storage", err);
    }
  }, []);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem("farm_cart", JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to persist cart to storage", err);
    }
  }, [items]);

  // Hash map for O(1) lookups and deduplication
  const createItemsHashMap = (cartItems: CartItem[]) => {
    const hashMap = new Map<number, CartItem>();
    cartItems.forEach((item) => hashMap.set(item.id, item));
    return hashMap;
  };

  // Greedy algorithm: prioritize items with best value (price/quantity ratio)
  const optimizeCartItems = (cartItems: CartItem[]): CartItem[] => {
    return cartItems
      .filter((item) => item.quantity > 0) // Remove zero quantities
      .sort((a, b) => {
        // Greedy approach: sort by value efficiency (lower price per unit first)
        const aEfficiency = a.price / a.quantity;
        const bEfficiency = b.price / b.quantity;
        return aEfficiency - bEfficiency;
      });
  };

  const addToCart = (product: Product, quantity = 1) => {
    setItems((currentItems) => {
      // Use hash map for O(1) deduplication check
      const itemsMap = createItemsHashMap(currentItems);

      if (itemsMap.has(product.id)) {
        // Greedy approach: always add to existing item for better efficiency
        const existingItem = itemsMap.get(product.id)!;
        existingItem.quantity += quantity;
        itemsMap.set(product.id, existingItem);
        toast.success(`Updated quantity of ${product.name} in cart`);
      } else {
        // Add new item to hash map
        itemsMap.set(product.id, { ...product, quantity });
        toast.success(`${product.name} added to cart`);
      }

      // Convert back to array and apply greedy optimization
      const updatedItems = Array.from(itemsMap.values());
      return optimizeCartItems(updatedItems);
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((currentItems) => {
      // Use hash map for efficient removal
      const itemsMap = createItemsHashMap(currentItems);
      itemsMap.delete(productId);

      toast.info("Item removed from cart");
      return optimizeCartItems(Array.from(itemsMap.values()));
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) => {
      const itemsMap = createItemsHashMap(currentItems);

      if (itemsMap.has(productId)) {
        const item = itemsMap.get(productId)!;
        item.quantity = quantity;
        itemsMap.set(productId, item);
      }

      return optimizeCartItems(Array.from(itemsMap.values()));
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("farm_cart");
    toast.info("Cart cleared");
  };

  // Greedy calculation: sum all items efficiently
  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
