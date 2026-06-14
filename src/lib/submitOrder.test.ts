import { describe, it, expect, vi, beforeEach } from 'vitest';

const s = vi.hoisted(() => ({
  uploadErrors: [] as (null | { message: string })[],
  insertError: null as null | { message: string },
  uploads: [] as { path: string }[],
  inserted: null as Record<string, unknown> | null
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    storage: {
      from: () => ({
        upload: (path: string) => {
          s.uploads.push({ path });
          return Promise.resolve({ error: s.uploadErrors.shift() ?? null });
        }
      })
    },
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        s.inserted = row;
        return Promise.resolve({ error: s.insertError });
      }
    })
  }
}));

import { submitOrder, type OrderPayload } from './submitOrder';

const payload: OrderPayload = {
  groomName: 'א', brideName: 'ב', groomPhone: '1', bridePhone: '2', email: 'a@b.com',
  eventDate: '2026-09-01', eventLocation: 'חדרה', packageId: 'classic-s', packageTitle: 'S',
  tableTier: null, compositesCount: '', spongeCount: '',
  referralSource: 'venue', referralDetail: 'אולמי היער', includeDelivery: true,
  upgrades: [{ description: 'x', price: 1 }], basePrice: 2900, upgradesTotal: 1,
  deliveryPrice: 500, couponCode: '', couponDiscount: 0, totalPrice: 3401,
  groomSignDate: '2026-01-01', brideSignDate: '2026-01-01',
  status: 'approved', orderSource: 'whatsapp', receivedBy: 'owner', internalNotes: 'הערה', adminDiscount: 100
};
const sig = 'data:image/png;base64,aGVsbG8=';

beforeEach(() => {
  s.uploadErrors = [];
  s.insertError = null;
  s.uploads = [];
  s.inserted = null;
});

describe('submitOrder', () => {
  it('uploads both signatures and inserts the order', async () => {
    const res = await submitOrder(payload, sig, sig);
    expect(res.id).toBeTruthy();
    expect(s.uploads.length).toBe(2);
    expect(s.inserted?.package_title).toBe('S');
    expect(s.inserted?.event_date).toBe('2026-09-01');
    expect(s.inserted?.groom_signature_path).toContain('groom.png');
  });

  it('stores referral + admin metadata when provided', async () => {
    await submitOrder(payload, sig, sig);
    expect(s.inserted?.referral_source).toBe('venue');
    expect(s.inserted?.referral_detail).toBe('אולמי היער');
    expect(s.inserted?.status).toBe('approved');
    expect(s.inserted?.order_source).toBe('whatsapp');
    expect(s.inserted?.received_by).toBe('owner');
    expect(s.inserted?.internal_notes).toBe('הערה');
    expect(s.inserted?.admin_discount).toBe(100);
  });

  it('stores null/defaults for empty optional fields', async () => {
    await submitOrder({ ...payload, eventDate: '', compositesCount: '', spongeCount: '', referralSource: '', referralDetail: '', couponCode: '', groomSignDate: '', brideSignDate: '', status: '', orderSource: '', receivedBy: '', internalNotes: '', adminDiscount: 0 }, sig, sig);
    expect(s.inserted?.event_date).toBeNull();
    expect(s.inserted?.composites_count).toBeNull();
    expect(s.inserted?.referral_source).toBeNull();
    expect(s.inserted?.referral_detail).toBeNull();
    expect(s.inserted?.coupon_code).toBeNull();
    expect(s.inserted?.groom_sign_date).toBeNull();
    expect(s.inserted?.status).toBe('new');
    expect(s.inserted?.order_source).toBeNull();
    expect(s.inserted?.internal_notes).toBeNull();
    expect(s.inserted?.admin_discount).toBe(0);
  });

  it('throws if the groom signature upload fails', async () => {
    s.uploadErrors = [{ message: 'groom upload failed' }];
    await expect(submitOrder(payload, sig, sig)).rejects.toEqual({ message: 'groom upload failed' });
  });

  it('throws if the bride signature upload fails', async () => {
    s.uploadErrors = [null, { message: 'bride upload failed' }];
    await expect(submitOrder(payload, sig, sig)).rejects.toEqual({ message: 'bride upload failed' });
  });

  it('throws if the insert fails', async () => {
    s.insertError = { message: 'insert failed' };
    await expect(submitOrder(payload, sig, sig)).rejects.toEqual({ message: 'insert failed' });
  });

  it('falls back to image/png for a data URL without an explicit mime', async () => {
    // header ללא תבנית ":...;" → mimeMatch הוא null → fallback ל-image/png
    await submitOrder(payload, 'noheader,aGk=', sig);
    expect(s.uploads.length).toBe(2);
  });
});
