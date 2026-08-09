import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitCartOrder, type CartOrderInput } from './submitCartOrder';

const s = vi.hoisted(() => ({
  insert: vi.fn(),
  upload: vi.fn()
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => ({ insert: s.insert })),
    storage: {
      from: vi.fn(() => ({ upload: s.upload }))
    }
  }
}));

const input: CartOrderInput = {
  customer: {
    eventType: 'henna',
    fullName: ' ישראל ',
    additionalName: '',
    phone: ' 0501234567 ',
    additionalPhone: '',
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
    customColors: 'פרחים לבנים, אקססוריז זהב ובלונים ורודים',
    flowerColor: '',
    balloonColor: '',
    tableclothColor: '',
    customRequest: 'פרחים עדינים',
    couponCode: 'מתנה',
    couponApplied: true
  },
  subtotal: 7900,
  includeDelivery: false,
  deliveryPrice: 0,
  totalPrice: 7900,
  signatures: {
    primary: { dataUrl: '', typedName: 'ישראל ישראלי', signedAt: '2026-08-09' },
    secondary: null
  },
  brandLogoUrl: 'https://cdn.example/logo.png'
};

beforeEach(() => {
  s.insert.mockReset();
  s.upload.mockReset();
  s.upload.mockResolvedValue({ error: null });
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
});

describe('submitCartOrder', () => {
  it('inserts a signed order selection with normalized fields and free-text colors', async () => {
    s.insert.mockResolvedValue({ error: null });

    await expect(submitCartOrder(input)).resolves.toEqual({ id: '00000000-0000-4000-8000-000000000001' });
    expect(s.upload).not.toHaveBeenCalled();
    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      groom_name: 'ישראל',
      bride_name: '-',
      groom_phone: '0501234567',
      bride_phone: '0501234567',
      email: 'israel@example.com',
      event_location: 'אולם',
      package_id: 'classic-s,bar',
      package_title: 'Classic S | Bar × 2',
      base_price: 7900,
      delivery_price: 0,
      total_price: 7900,
      include_delivery: false,
      coupon_code: 'מתנה',
      order_source: 'website-order-selection',
      groom_sign_date: '2026-08-09',
      groom_signature_path: null,
      bride_signature_path: null
    }));

    const payload = s.insert.mock.calls[0][0] as { referral_detail: string; internal_notes: string };
    expect(JSON.parse(payload.referral_detail)).toMatchObject({
      eventType: 'henna',
      customColors: 'פרחים לבנים, אקססוריז זהב ובלונים ורודים',
      customRequest: 'פרחים עדינים',
      primarySigner: 'ישראל ישראלי',
      primarySignatureKind: 'typed',
      brandLogoUrl: 'https://cdn.example/logo.png',
      quoteOnly: true,
      noPaymentCollected: true
    });
    expect(JSON.parse(payload.internal_notes)).toMatchObject({ policyVersion: '2026-08-09' });
  });

  it('keeps both hosts and adds optional delivery for exactly ₪500', async () => {
    s.insert.mockResolvedValue({ error: null });
    await submitCartOrder({
      ...input,
      customer: {
        ...input.customer,
        eventType: 'wedding',
        additionalName: ' שרה ',
        additionalPhone: ' 0507654321 ',
        notes: ' בקשה נוספת '
      },
      includeDelivery: true,
      deliveryPrice: 500,
      totalPrice: 8400,
      signatures: {
        ...input.signatures,
        secondary: { dataUrl: '', typedName: 'שרה ישראלי', signedAt: '2026-08-09' }
      },
      preferences: { ...input.preferences, couponCode: '', couponApplied: false }
    });

    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      bride_name: 'שרה',
      bride_phone: '0507654321',
      coupon_code: null,
      include_delivery: true,
      delivery_price: 500,
      total_price: 8400,
      bride_sign_date: '2026-08-09'
    }));
    const payload = s.insert.mock.calls[0][0] as { referral_detail: string };
    expect(JSON.parse(payload.referral_detail)).toMatchObject({
      customerNotes: ' בקשה נוספת ',
      secondarySigner: 'שרה ישראלי',
      secondarySignatureKind: 'typed',
      deliveryIncluded: true
    });
  });

  it('uploads drawn signatures to the private signatures bucket', async () => {
    s.insert.mockResolvedValue({ error: null });
    await submitCartOrder({
      ...input,
      signatures: {
        primary: { dataUrl: 'data:image/png;base64,eA==', typedName: '', signedAt: '2026-08-09' },
        secondary: { dataUrl: 'data:image/png;base64,eQ==', typedName: '', signedAt: '2026-08-09' }
      }
    });

    expect(s.upload).toHaveBeenNthCalledWith(
      1,
      '00000000-0000-4000-8000-000000000001/primary.png',
      expect.any(Blob),
      { contentType: 'image/png', upsert: false }
    );
    expect(s.upload).toHaveBeenNthCalledWith(
      2,
      '00000000-0000-4000-8000-000000000001/secondary.png',
      expect.any(Blob),
      { contentType: 'image/png', upsert: false }
    );
    expect(s.insert).toHaveBeenCalledWith(expect.objectContaining({
      groom_signature_path: '00000000-0000-4000-8000-000000000001/primary.png',
      bride_signature_path: '00000000-0000-4000-8000-000000000001/secondary.png'
    }));
  });

  it('throws signature upload and order insert errors', async () => {
    const uploadError = new Error('upload failed');
    s.upload.mockResolvedValueOnce({ error: uploadError });
    await expect(submitCartOrder({
      ...input,
      signatures: {
        primary: { dataUrl: 'data:image/png;base64,eA==', typedName: '', signedAt: '2026-08-09' },
        secondary: null
      }
    })).rejects.toBe(uploadError);

    const insertError = new Error('insert failed');
    s.upload.mockResolvedValue({ error: null });
    s.insert.mockResolvedValue({ error: insertError });
    await expect(submitCartOrder(input)).rejects.toBe(insertError);
  });
});

