import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartOrderInput } from './submitCartOrder';

const state = vi.hoisted(() => ({
  configured: true,
  insert: vi.fn(),
  upload: vi.fn()
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
  supabase: {
    from: () => ({ insert: state.insert }),
    storage: { from: () => ({ upload: state.upload }) }
  }
}));

import { submitCartOrder } from './submitCartOrder';

const base = (): CartOrderInput => ({
  customer: {
    eventType: 'wedding',
    fullName: ' Primary Customer ',
    additionalName: ' Secondary Customer ',
    phone: ' 0501111111 ',
    additionalPhone: '',
    email: ' a@example.com ',
    eventDate: '',
    eventLocation: ' Hall ',
    notes: 'notes'
  },
  items: [{ id: 'one', title: 'One', price: 100, quantity: 1 }],
  preferences: {
    palette: '', customColors: '', flowerColor: '', balloonColor: '', tableclothColor: '',
    customRequest: '', couponCode: '', couponApplied: false
  },
  subtotal: 100,
  includeDelivery: false,
  deliveryPrice: 0,
  totalPrice: 100,
  signatures: {
    primary: { dataUrl: '', typedName: '', signedAt: '' },
    secondary: { dataUrl: '', typedName: '', signedAt: '' }
  },
  brandLogoUrl: ''
});

beforeEach(() => {
  state.configured = true;
  state.insert.mockReset().mockResolvedValue({ error: null });
  state.upload.mockReset().mockResolvedValue({ error: null });
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000099');
});

describe('submitCartOrder exhaustive branches', () => {
  it('returns a generated id without network work when Supabase is unavailable', async () => {
    state.configured = false;
    await expect(submitCartOrder(base())).resolves.toEqual({ id: '00000000-0000-4000-8000-000000000099' });
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.upload).not.toHaveBeenCalled();
  });

  it('uses customer names as signature fallbacks and writes null optional dates', async () => {
    await submitCartOrder(base());
    const payload = state.insert.mock.calls[0][0];
    expect(payload).toMatchObject({
      event_date: null,
      bride_phone: '0501111111',
      groom_sign_date: null,
      bride_sign_date: null,
      coupon_code: null
    });
    const metadata = JSON.parse(payload.referral_detail);
    expect(metadata).toMatchObject({
      primarySigner: 'Primary Customer',
      secondarySigner: 'Secondary Customer',
      secondarySignatureKind: 'none'
    });
  });

  it('rejects a malformed signature data URL without a comma', async () => {
    const input = base();
    input.signatures.primary.dataUrl = 'data:image/png;base64';
    await expect(submitCartOrder(input)).rejects.toThrow('Invalid signature image');
    expect(state.upload).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('rejects a signature data URL with an unsupported MIME/header', async () => {
    const input = base();
    input.signatures.primary.dataUrl = 'data:image/jpeg;base64,eA==';
    await expect(submitCartOrder(input)).rejects.toThrow('Unsupported signature image');
    expect(state.upload).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
});
