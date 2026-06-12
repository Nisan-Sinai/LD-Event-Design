import { describe, it, expect } from 'vitest';
import { calcPricing, DELIVERY_FEE } from './pricing';

const base = {
  basePrice: 0,
  upgradesTotal: 0,
  addonsTotal: 0,
  includeDelivery: false,
  couponDiscount: 0,
  adminDiscount: 0,
  manualTotal: null as number | null
};

describe('calcPricing', () => {
  it('sums a single package with no extras', () => {
    const r = calcPricing({ ...base, basePrice: 2900 });
    expect(r.totalPrice).toBe(2900);
    expect(r.deliveryPrice).toBe(0);
    expect(r.manualOverride).toBeNull();
  });

  it('sums multiple packages (base already aggregated) + add-ons + upgrades', () => {
    const r = calcPricing({ ...base, basePrice: 2900 + 2500, addonsTotal: 700, upgradesTotal: 300 });
    expect(r.totalPrice).toBe(2900 + 2500 + 700 + 300);
  });

  it('adds the delivery fee when delivery is included', () => {
    const r = calcPricing({ ...base, basePrice: 4600, includeDelivery: true });
    expect(r.deliveryPrice).toBe(DELIVERY_FEE);
    expect(r.totalPrice).toBe(4600 + DELIVERY_FEE);
  });

  it('subtracts the coupon discount', () => {
    const r = calcPricing({ ...base, basePrice: 6300, addonsTotal: 500, couponDiscount: 500 });
    expect(r.totalPrice).toBe(6300 + 500 - 500);
  });

  it('subtracts the admin discount', () => {
    const r = calcPricing({ ...base, basePrice: 3500, adminDiscount: 400 });
    expect(r.totalPrice).toBe(3500 - 400);
  });

  it('manual total overrides the computed total', () => {
    const r = calcPricing({ ...base, basePrice: 4600, addonsTotal: 1000, manualTotal: 5000 });
    expect(r.manualOverride).toBe(5000);
    expect(r.totalPrice).toBe(5000);
  });

  it('never returns a negative total', () => {
    const r = calcPricing({ ...base, basePrice: 100, adminDiscount: 999, couponDiscount: 999 });
    expect(r.totalPrice).toBe(0);
  });

  it('clamps a negative manual override to zero', () => {
    const r = calcPricing({ ...base, basePrice: 2900, manualTotal: -50 });
    expect(r.totalPrice).toBe(0);
  });

  it('combines all factors correctly', () => {
    const r = calcPricing({
      basePrice: 2900 + 4600,
      upgradesTotal: 300,
      addonsTotal: 900,
      includeDelivery: true,
      couponDiscount: 500,
      adminDiscount: 200,
      manualTotal: null
    });
    // 7500 + 300 + 900 + 500(delivery) - 500 - 200
    expect(r.totalPrice).toBe(8500);
  });
});
