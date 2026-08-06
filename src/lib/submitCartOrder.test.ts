import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitCartOrder, type CartOrderInput } from './submitCartOrder';

const s = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => ({ insert: s.insert }))
  }
}));

const input: CartOrderInput = {
  customer: {
    fullName: ' ישראל ',
    additionalName: '',
    phone: ' 0501234567 ',
    email: ' israel@example.com ',
    eventDate: '2026-10-10',
    eventLocation: ' אולם ',
    notes: ''
  },
  items: [
    { id: 'classic-s', title: 'Classic S', price: 2900, quantity: 1 },
    { id: 'bar', title: 'Bar', price: 2500, quantity: 2 }
  ],
  subtotal: 7900,
  deliveryPrice: 500,
  totalPrice: 8400
};

beforeEach(() => {
  s.insert.mockReset();
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
});

describe('submitCartOrder', () => {
  it('inserts a guest cart order with normalized fields', async () => {
    s.insert.mockResolvedValue({ error: null });

    await expect(submitCartOrder(input)).resolves.toEqual({ id: '00000000-0000-4000-8000-000000000001' });
    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      groom_name: 'ישראל',
      bride_name: '-',
      groom_phone: '0501234567',
      email: 'israel@example.com',
      event_location: 'אולם',
      package_id: 'classic-s,bar',
      package_title: 'Classic S | Bar × 2',
      base_price: 7900,
      delivery_price: 500,
      total_price: 8400,
      include_delivery: true,
      order_source: 'website-cart'
    }));
  });

  it('keeps optional names and notes and supports no delivery', async () => {
    s.insert.mockResolvedValue({ error: null });
    await submitCartOrder({
      ...input,
      customer: { ...input.customer, additionalName: ' שרה ', notes: ' בקשה מיוחדת ' },
      deliveryPrice: 0,
      totalPrice: input.subtotal
    });

    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      bride_name: 'שרה',
      referral_detail: 'בקשה מיוחדת',
      internal_notes: 'בקשה מיוחדת',
      include_delivery: false
    }));
  });

  it('throws a Supabase insert error', async () => {
    const error = new Error('insert failed');
    s.insert.mockResolvedValue({ error });
    await expect(submitCartOrder(input)).rejects.toBe(error);
  });
});
