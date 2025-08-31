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
  // For delivery packing: returns array of boxes with items assigned
  packForDelivery: (options?: {
    maxWeightKg?: number;
    maxVolumeCm3?: number;
  }) => {
    boxId: number;
    items: CartItem[];
    totalWeightKg: number;
    totalVolumeCm3: number;
  }[];
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
      .slice()
      .sort((a, b) => {
        // Greedy approach: sort by value efficiency (lower price per unit first)
        const aEfficiency = a.price / a.quantity;
        const bEfficiency = b.price / b.quantity;
        return aEfficiency - bEfficiency;
      });
  };

  // Greedy first-fit decreasing for delivery packing
  // Boxes are filled by sorting items by descending volume (or weight if volume missing)
  const packForDelivery = (options?: {
    maxWeightKg?: number;
    maxVolumeCm3?: number;
  }) => {
    const maxWeightKg = options?.maxWeightKg ?? 10; // default 10kg
    const maxVolumeCm3 = options?.maxVolumeCm3 ?? 40000; // default 40L

    // Expand items into individual units to pack per-piece when quantity > 1
    const expanded: CartItem[] = [];
    items.forEach((it) => {
      for (let i = 0; i < it.quantity; i++) {
        expanded.push({ ...it, quantity: 1 });
      }
    });

    // Choose key metric: volume if available else weight
    const metric = (it: CartItem) => {
      if (typeof it.volumeCm3 === "number") return it.volumeCm3;
      if (typeof it.weightKg === "number") return it.weightKg * 1000; // convert kg to grams as proxy
      return 0; // unknown size
    };

    // Sort descending by metric
    const bySizeDesc = expanded.slice().sort((a, b) => metric(b) - metric(a));

    const boxes: {
      boxId: number;
      items: CartItem[];
      totalWeightKg: number;
      totalVolumeCm3: number;
    }[] = [];

    bySizeDesc.forEach((unit) => {
      const unitWeight = unit.weightKg ?? 0;
      const unitVolume = unit.volumeCm3 ?? 0;

      // Try to fit into first box that has capacity
      let placed = false;
      for (const box of boxes) {
        if (
          box.totalWeightKg + unitWeight <= maxWeightKg &&
          box.totalVolumeCm3 + unitVolume <= maxVolumeCm3
        ) {
          box.items.push(unit);
          box.totalWeightKg += unitWeight;
          box.totalVolumeCm3 += unitVolume;
          placed = true;
          break;
        }
      }

      if (!placed) {
        boxes.push({
          boxId: boxes.length + 1,
          items: [unit],
          totalWeightKg: unitWeight,
          totalVolumeCm3: unitVolume,
        });
      }
    });

    return boxes;
  };

  const addToCart = (product: Product, quantity = 1) => {
    setItems((currentItems) => {
      // Defensive id normalization (some sources may provide non-numeric ids)
      const parsedId = Number(product.id);
      const normalizedId = Number.isNaN(parsedId) ? -Date.now() : parsedId;

      // Find existing item by normalized id
      const existingIndex = currentItems.findIndex(
        (it) => Number(it.id) === normalizedId
      );

      if (existingIndex !== -1) {
        // Update quantity immutably
        const updated = currentItems.map((it, i) =>
          i === existingIndex ? { ...it, quantity: it.quantity + quantity } : it
        );
        toast.success(`Updated quantity of ${product.name} in cart`);
        return optimizeCartItems(updated);
      }

      // Add new item (normalize id on stored item)
      const newItem: CartItem = {
        ...product,
        id: normalizedId,
        quantity,
      } as CartItem;
      toast.success(`${product.name} added to cart`);
      return optimizeCartItems([...currentItems, newItem]);
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((currentItems) => {
      const updated = currentItems.filter((it) => it.id !== productId);
      toast.info("Item removed from cart");
      return optimizeCartItems(updated);
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) => {
      const updated = currentItems.map((it) =>
        it.id === productId ? { ...it, quantity } : it
      );
      return optimizeCartItems(updated);
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
        packForDelivery,
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
