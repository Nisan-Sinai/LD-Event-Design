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
  preferences: {
    palette: 'לבן וזהב',
    customColors: 'שמנת וזהב מט',
    customRequest: 'פרחים עדינים',
    couponCode: 'מתנה',
    couponApplied: true
  },
  subtotal: 7900,
  deliveryPrice: 0,
  totalPrice: 7900
};

beforeEach(() => {
  s.insert.mockReset();
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
});

describe('submitCartOrder', () => {
  it('inserts a quote request with normalized fields and design preferences', async () => {
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
      delivery_price: 0,
      total_price: 7900,
      include_delivery: false,
      coupon_code: 'מתנה',
      order_source: 'website-quote-builder'
    }));

    const payload = s.insert.mock.calls[0][0] as { referral_detail: string; internal_notes: string };
    expect(JSON.parse(payload.referral_detail)).toMatchObject({
      palette: 'לבן וזהב',
      customColors: 'שמנת וזהב מט',
      customRequest: 'פרחים עדינים',
      quoteOnly: true,
      noPaymentCollected: true
    });
    expect(JSON.parse(payload.internal_notes)).toMatchObject({ policyVersion: '2026-08-07' });
  });

  it('keeps optional names and customer notes without a coupon', async () => {
    s.insert.mockResolvedValue({ error: null });
    await submitCartOrder({
      ...input,
      customer: { ...input.customer, additionalName: ' שרה ', notes: ' בקשה נוספת ' },
      preferences: { ...input.preferences, couponCode: '', couponApplied: false }
    });

    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      bride_name: 'שרה',
      coupon_code: null,
      include_delivery: false
    }));
    const payload = s.insert.mock.calls[0][0] as { referral_detail: string };
    expect(JSON.parse(payload.referral_detail)).toMatchObject({ customerNotes: ' בקשה נוספת ' });
  });

  it('throws a Supabase insert error', async () => {
    const error = new Error('insert failed');
    s.insert.mockResolvedValue({ error });
    await expect(submitCartOrder(input)).rejects.toBe(error);
  });
});
