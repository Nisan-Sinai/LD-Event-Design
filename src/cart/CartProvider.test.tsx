import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const coupon = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock('../lib/coupons', () => ({ validateCouponCode: coupon.validate }));

import {
  CART_DESIGN_STORAGE_KEY,
  CART_STORAGE_KEY,
  CartProvider,
  MINIMUM_ORDER,
  useCart,
  type CartProduct
} from './CartProvider';

const product: CartProduct = {
  id: 'classic-s',
  title: 'Classic S',
  subtitle: 'Package',
  category: 'Wedding',
  price: MINIMUM_ORDER,
  svgType: 'chuppah-s'
};

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

beforeEach(() => {
  window.localStorage.clear();
  coupon.validate.mockReset().mockResolvedValue(false);
});

describe('CartProvider', () => {
  it('starts empty and persists additions', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);

    act(() => result.current.addItem(product));
    expect(result.current.itemCount).toBe(1);
    expect(result.current.subtotal).toBe(MINIMUM_ORDER);

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

  it('removes one item and clears the cart and quote preferences', async () => {
    coupon.validate.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(product);
      result.current.addItem({ ...product, id: 'bar', title: 'Bar' });
      result.current.setPalette('בורדו וזהב');
    });
    await act(async () => {
      await result.current.applyCoupon('server-validated-code');
    });
    act(() => result.current.removeItem(product.id));
    expect(result.current.items.map((item) => item.id)).toEqual(['bar']);

    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.preferences).toMatchObject({ palette: 'לבן וזהב', couponApplied: false });
  });

  it('persists palette, exact colors and custom requests separately from cart items', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.setPalette('ורוד פודרה וזהב־ורוד');
      result.current.setCustomColors('ורוד עתיק וזהב מט');
      result.current.setCustomRequest('קיר צילום פרחוני');
    });

    expect(result.current.preferences).toMatchObject({
      palette: 'ורוד פודרה וזהב־ורוד',
      customColors: 'ורוד עתיק וזהב מט',
      customRequest: 'קיר צילום פרחוני'
    });
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(CART_DESIGN_STORAGE_KEY) || '{}')).toMatchObject({ customRequest: 'קיר צילום פרחוני' }));
  });

  it('accepts only a code approved by the server', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    coupon.validate.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    let accepted = true;
    await act(async () => {
      accepted = await result.current.applyCoupon('invalid');
    });
    expect(accepted).toBe(false);
    expect(result.current.preferences.couponApplied).toBe(false);

    await act(async () => {
      accepted = await result.current.applyCoupon('  server-validated-code  ');
    });
    expect(accepted).toBe(true);
    expect(coupon.validate).toHaveBeenLastCalledWith('server-validated-code');
    expect(result.current.preferences).toMatchObject({ couponCode: 'server-validated-code', couponApplied: true });

    act(() => result.current.clearCoupon());
    expect(result.current.preferences).toMatchObject({ couponCode: '', couponApplied: false });
  });

  it('rejects an empty coupon and safely handles a validation outage', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => {
      expect(await result.current.applyCoupon('   ')).toBe(false);
    });
    expect(coupon.validate).not.toHaveBeenCalled();

    coupon.validate.mockRejectedValueOnce(new Error('network'));
    await act(async () => {
      expect(await result.current.applyCoupon('candidate')).toBe(false);
    });
    expect(result.current.preferences).toMatchObject({ couponCode: 'candidate', couponApplied: false });
  });

  it('revalidates a stored coupon instead of trusting localStorage', async () => {
    coupon.validate.mockResolvedValueOnce(true);
    window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      palette: 'בורדו וזהב',
      customColors: 'בורדו',
      customRequest: 'בקשה',
      couponCode: 'stored-candidate',
      couponApplied: true
    }));
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.preferences.couponApplied).toBe(false);
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith('stored-candidate'));
    await waitFor(() => expect(result.current.preferences.couponApplied).toBe(true));
  });

  it('keeps a forged stored coupon rejected after server revalidation', async () => {
    coupon.validate.mockResolvedValueOnce(false);
    window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      couponCode: 'forged',
      couponApplied: true
    }));
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith('forged'));
    expect(result.current.preferences.couponApplied).toBe(false);
  });

  it('handles a stored coupon revalidation error without trusting it', async () => {
    coupon.validate.mockRejectedValueOnce(new Error('offline'));
    window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      couponCode: 'stored-candidate',
      couponApplied: true
    }));
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(coupon.validate).toHaveBeenCalled());
    expect(result.current.preferences.couponApplied).toBe(false);
  });

  it('hydrates and normalizes valid stored cart and design preferences', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ ...product, price: -5, quantity: 2.9 }]));
    window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      palette: 'בורדו וזהב',
      customColors: 'בורדו',
      customRequest: 'בקשה'
    }));
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items[0]).toMatchObject({ price: 0, quantity: 2 });
    expect(result.current.preferences).toMatchObject({ palette: 'בורדו וזהב', couponCode: '', couponApplied: false });
  });

  it('ignores malformed storage values', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{bad');
    window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, '{bad');
    const first = renderHook(() => useCart(), { wrapper });
    expect(first.result.current.items).toEqual([]);
    expect(first.result.current.preferences.palette).toBe('לבן וזהב');
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
