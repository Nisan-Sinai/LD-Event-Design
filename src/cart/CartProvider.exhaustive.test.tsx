import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const coupon = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock('../lib/coupons', () => ({ validateCouponCode: coupon.validate }));

import {
  CART_DESIGN_STORAGE_KEY,
  CART_STORAGE_KEY,
  CartProvider,
  useCart,
  type CartProduct
} from './CartProvider';

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;
const product = (id: string, price = 100): CartProduct => ({
  id,
  title: `title-${id}`,
  subtitle: 'subtitle',
  category: 'category',
  price,
  svgType: 'default'
});

beforeEach(() => {
  localStorage.clear();
  coupon.validate.mockReset().mockResolvedValue(false);
});

describe('CartProvider exhaustive branches', () => {
  it('exposes safe no-op defaults when useCart is called outside a provider', async () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    act(() => {
      result.current.addItem(product('a'));
      result.current.updateQuantity('a', 2);
      result.current.removeItem('a');
      result.current.clearCart();
      result.current.setPalette('x');
      result.current.setCustomColors('x');
      result.current.setDesignColor('flowerColor', 'red');
      result.current.setCustomRequest('x');
      result.current.clearCoupon();
    });
    await expect(result.current.applyCoupon('x')).resolves.toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it('rejects every malformed stored cart field and keeps only a fully valid row', () => {
    const valid = { ...product('valid'), quantity: 1 };
    const invalid = [
      null,
      {},
      { ...valid, id: 1 },
      { ...valid, title: 1 },
      { ...valid, subtitle: 1 },
      { ...valid, category: 1 },
      { ...valid, svgType: 1 },
      { ...valid, price: '100' },
      { ...valid, price: Number.NaN },
      { ...valid, quantity: '1' },
      { ...valid, quantity: Number.POSITIVE_INFINITY }
    ];
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...invalid, valid]));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('valid');
  });

  it('falls back independently for every malformed stored design field', () => {
    localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      palette: '   ',
      customColors: 1,
      flowerColor: 1,
      balloonColor: 1,
      tableclothColor: 1,
      customRequest: 1,
      couponCode: 1,
      couponApplied: true
    }));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.preferences).toEqual({
      palette: 'לבן וזהב',
      customColors: '',
      flowerColor: '',
      balloonColor: '',
      tableclothColor: '',
      customRequest: '',
      couponCode: '',
      couponApplied: false
    });
  });

  it('hydrates every optional design string and edits legacy design colors', () => {
    localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
      palette: 'כחול',
      customColors: 'זהב',
      flowerColor: 'לבן',
      balloonColor: 'כחול',
      tableclothColor: 'שמנת',
      customRequest: 'בקשה',
      couponCode: ''
    }));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.preferences).toMatchObject({
      flowerColor: 'לבן',
      balloonColor: 'כחול',
      tableclothColor: 'שמנת'
    });
    act(() => {
      result.current.setDesignColor('flowerColor', 'אדום');
      result.current.setDesignColor('balloonColor', 'ירוק');
      result.current.setDesignColor('tableclothColor', 'שחור');
    });
    expect(result.current.preferences).toMatchObject({
      flowerColor: 'אדום',
      balloonColor: 'ירוק',
      tableclothColor: 'שחור'
    });
  });

  it('normalizes a negative price on add and preserves unrelated rows while incrementing/updating quantities', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(product('a', -10));
      result.current.addItem(product('b', 20));
      result.current.addItem({ ...product('a', 30), title: 'new-a' });
      result.current.updateQuantity('a', 4.9);
    });
    expect(result.current.items).toEqual([
      expect.objectContaining({ id: 'a', title: 'new-a', price: 30, quantity: 4 }),
      expect.objectContaining({ id: 'b', price: 20, quantity: 1 })
    ]);
  });

  it('ignores a stored coupon resolution after the provider unmounts', async () => {
    let resolve!: (accepted: boolean) => void;
    coupon.validate.mockImplementationOnce(() => new Promise<boolean>((done) => { resolve = done; }));
    localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({ couponCode: 'stored' }));
    const hook = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith('stored'));
    hook.unmount();
    await act(async () => {
      resolve(true);
      await Promise.resolve();
    });
  });

  it('does not let late stored-code success overwrite a newer user-entered coupon', async () => {
    let resolveStored!: (accepted: boolean) => void;
    coupon.validate
      .mockImplementationOnce(() => new Promise<boolean>((done) => { resolveStored = done; }))
      .mockResolvedValueOnce(false);
    localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({ couponCode: 'stored' }));
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith('stored'));

    await act(async () => {
      await result.current.applyCoupon('new-code');
    });
    expect(result.current.preferences.couponCode).toBe('new-code');

    await act(async () => {
      resolveStored(true);
      await Promise.resolve();
    });
    expect(result.current.preferences).toMatchObject({ couponCode: 'new-code', couponApplied: false });
  });

  it('does not let a late stored-code failure overwrite a newer user-entered coupon', async () => {
    let rejectStored!: (error: Error) => void;
    coupon.validate
      .mockImplementationOnce(() => new Promise<boolean>((_done, reject) => { rejectStored = reject; }))
      .mockResolvedValueOnce(true);
    localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({ couponCode: 'stored' }));
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith('stored'));

    await act(async () => {
      await result.current.applyCoupon('new-code');
    });
    expect(result.current.preferences.couponApplied).toBe(true);

    await act(async () => {
      rejectStored(new Error('old request failed'));
      await Promise.resolve();
    });
    expect(result.current.preferences).toMatchObject({ couponCode: 'new-code', couponApplied: true });
  });
});
