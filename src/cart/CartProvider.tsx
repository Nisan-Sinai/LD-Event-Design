import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const CART_STORAGE_KEY = 'ld-event-design-cart-v1';
export const MINIMUM_ORDER = 2500;

export interface CartProduct {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  image?: string;
  svgType: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProduct) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const EMPTY_CART: CartValue = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {}
};

const CartContext = createContext<CartValue>(EMPTY_CART);

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is CartItem => {
        if (!item || typeof item !== 'object') return false;
        const candidate = item as Partial<CartItem>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.title === 'string' &&
          typeof candidate.subtitle === 'string' &&
          typeof candidate.category === 'string' &&
          typeof candidate.svgType === 'string' &&
          typeof candidate.price === 'number' &&
          Number.isFinite(candidate.price) &&
          typeof candidate.quantity === 'number' &&
          Number.isFinite(candidate.quantity)
        );
      })
      .map((item) => ({ ...item, price: Math.max(0, item.price), quantity: Math.max(1, Math.floor(item.quantity)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: CartProduct) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, ...product, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, price: Math.max(0, product.price), quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const normalized = Math.floor(quantity);
    setItems((current) =>
      normalized <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity: normalized } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart };
  }, [items, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  return useContext(CartContext);
}
