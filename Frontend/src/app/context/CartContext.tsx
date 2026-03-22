import React, { createContext, useContext, useState } from "react";
import { Product } from "../data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, weight: string, qty?: number) => void;
  removeFromCart: (productId: string, weight: string) => void;
  updateQuantity: (productId: string, weight: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  discount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const VALID_PROMOS: Record<string, number> = {
  ALEFARMS10: 0.1,
  WELCOME20: 0.2,
  SUMMER15: 0.15,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const addToCart = (product: Product, weight: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.selectedWeight === weight);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.selectedWeight === weight
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty, selectedWeight: weight }];
    });
  };

  const removeFromCart = (productId: string, weight: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedWeight === weight)));
  };

  const updateQuantity = (productId: string, weight: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, weight);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedWeight === weight ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const handleSetPromoCode = (code: string) => {
    setPromoCode(code);
    const upper = code.toUpperCase();
    setDiscount(VALID_PROMOS[upper] || 0);
  };

  const subtotal = items.reduce((sum, i) => {
    const price = i.product.variants.find((v) => v.weight === i.selectedWeight)?.price || i.product.basePrice;
    return sum + price * i.quantity;
  }, 0);

  const total = subtotal * (1 - discount);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, promoCode, setPromoCode: handleSetPromoCode, discount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
