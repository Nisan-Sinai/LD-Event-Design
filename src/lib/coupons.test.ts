import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  configured: true,
  rpc: vi.fn()
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return m.configured;
  },
  supabase: { rpc: m.rpc }
}));

import { validateCouponCode } from './coupons';

beforeEach(() => {
  m.configured = true;
  m.rpc.mockReset().mockResolvedValue({ data: false, error: null });
});

describe('validateCouponCode', () => {
  it('rejects empty codes without contacting Supabase', async () => {
    await expect(validateCouponCode('   ')).resolves.toBe(false);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it('rejects when Supabase is not configured', async () => {
    m.configured = false;
    await expect(validateCouponCode('candidate')).resolves.toBe(false);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it('delegates validation to the server and trims input', async () => {
    m.rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(validateCouponCode('  candidate  ')).resolves.toBe(true);
    expect(m.rpc).toHaveBeenCalledWith('validate_coupon', { p_code: 'candidate' });
  });

  it('returns false for a server rejection', async () => {
    m.rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(validateCouponCode('wrong')).resolves.toBe(false);
  });

  it('propagates Supabase errors', async () => {
    const error = new Error('rpc failed');
    m.rpc.mockResolvedValueOnce({ data: null, error });
    await expect(validateCouponCode('candidate')).rejects.toBe(error);
  });
});
