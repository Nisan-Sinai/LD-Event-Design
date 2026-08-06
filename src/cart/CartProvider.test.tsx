import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CART_STORAGE_KEY, CartProvider, useCart, type CartProduct } from './CartProvider';

const product: CartProduct = {
  id: 'classic-s',
  title: 'Classic S',
  subtitle: 'Package',
  category: 'Wedding',
  price: 2900,
  svgType: 'chuppah-s'
};

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

beforeEach(() => window.localStorage.clear());

describe('CartProvider', () => {
  it('starts empty and persists additions', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);

    act(() => result.current.addItem(product));
    expect(result.current.itemCount).toBe(1);
    expect(result.current.subtotal).toBe(2900);

    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]')).toHaveLength(1));
  });

  it('increments an existing item and updates its latest product details', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product));
    act(() => result.current.addItem({ ...product, title: 'Updated', price: 3000 }));

    expect(result.current.items[0]).toMatchObject({ title: 'Updated', quantity: 2, price: 3000 });
    expect(result.current.itemCount).toBe(2);
    expect(result.current.subtotal).toBe(6000);
  });

  it('updates quantity and removes an item when quantity reaches zero', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product));
    act(() => result.current.updateQuantity(product.id, 3.8));
    expect(result.current.items[0].quantity).toBe(3);

    act(() => result.current.updateQuantity(product.id, 0));
    expect(result.current.items).toEqual([]);
  });

  it('removes one item and clears the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(product);
      result.current.addItem({ ...product, id: 'bar', title: 'Bar' });
    });
    act(() => result.current.removeItem(product.id));
    expect(result.current.items.map((item) => item.id)).toEqual(['bar']);

    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
  });

  it('hydrates and normalizes a valid stored cart', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ...product, price: -5, quantity: 2.9 }]));
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items[0]).toMatchObject({ price: 0, quantity: 2 });
  });

  it('ignores malformed storage values', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{bad');
    const first = renderHook(() => useCart(), { wrapper });
    expect(first.result.current.items).toEqual([]);
    first.unmount();

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ nope: true }));
    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.items).toEqual([]);
    second.unmount();

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([null, { id: 'bad' }]));
    const third = renderHook(() => useCart(), { wrapper });
    expect(third.result.current.items).toEqual([]);
  });
});
