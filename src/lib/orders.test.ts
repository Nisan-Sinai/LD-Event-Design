import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState: {
  configured: boolean;
  result: { data: unknown; error: unknown };
  single: { data: unknown; error: unknown };
  signed: { data: unknown; error: unknown };
  eqCalls: unknown[][];
  fromCalls: number;
} = {
  configured: true,
  result: { data: [], error: null },
  single: { data: null, error: null },
  signed: { data: null, error: null },
  eqCalls: [],
  fromCalls: 0
};

vi.mock('./supabase', () => {
  function makeListQuery() {
    const q = {
      eq: (...args: unknown[]) => {
        mockState.eqCalls.push(args);
        return q;
      },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(mockState.result).then(resolve)
    };
    return q;
  }
  return {
    get isSupabaseConfigured() {
      return mockState.configured;
    },
    supabase: {
      from: () => {
        mockState.fromCalls++;
        return {
          select: () => ({
            order: () => makeListQuery(),
            eq: () => ({ single: () => Promise.resolve(mockState.single) })
          })
        };
      },
      storage: {
        from: () => ({ createSignedUrl: () => Promise.resolve(mockState.signed) })
      }
    }
  };
});

import { fetchOrders, fetchOrderById, signatureUrl } from './orders';

beforeEach(() => {
  mockState.configured = true;
  mockState.result = { data: [], error: null };
  mockState.single = { data: null, error: null };
  mockState.signed = { data: null, error: null };
  mockState.eqCalls = [];
  mockState.fromCalls = 0;
});

describe('fetchOrders', () => {
  it('returns [] without touching the DB when Supabase is not configured', async () => {
    mockState.configured = false;
    expect(await fetchOrders()).toEqual([]);
    expect(mockState.fromCalls).toBe(0);
  });

  it('admin mode (no userId): queries all orders without eq filter', async () => {
    const rows = [{ id: '1', groom_name: 'א', total_price: 100 }];
    mockState.result = { data: rows, error: null };
    expect(await fetchOrders()).toEqual(rows);
    expect(mockState.eqCalls).toEqual([]);
  });

  it('customer mode: filters by user_id', async () => {
    await fetchOrders({ userId: 'u-123' });
    expect(mockState.eqCalls).toEqual([['user_id', 'u-123']]);
  });

  it('throws when the query returns an error', async () => {
    mockState.result = { data: null, error: new Error('rls denied') };
    await expect(fetchOrders()).rejects.toThrow('rls denied');
  });

  it('normalizes null data to an empty array', async () => {
    mockState.result = { data: null, error: null };
    expect(await fetchOrders()).toEqual([]);
  });
});

describe('fetchOrderById', () => {
  it('returns null when not configured', async () => {
    mockState.configured = false;
    expect(await fetchOrderById('o1')).toBeNull();
  });

  it('returns the order row on success', async () => {
    const row = { id: 'o1', groom_name: 'דנה', total_price: 2500 };
    mockState.single = { data: row, error: null };
    expect(await fetchOrderById('o1')).toEqual(row);
  });

  it('throws on error', async () => {
    mockState.single = { data: null, error: new Error('not found') };
    await expect(fetchOrderById('o1')).rejects.toThrow('not found');
  });
});

describe('signatureUrl', () => {
  it('returns null when not configured', async () => {
    mockState.configured = false;
    expect(await signatureUrl('p/g.png')).toBeNull();
  });

  it('returns null for a null path', async () => {
    expect(await signatureUrl(null)).toBeNull();
  });

  it('returns null when signing fails', async () => {
    mockState.signed = { data: null, error: new Error('no access') };
    expect(await signatureUrl('p/g.png')).toBeNull();
  });

  it('returns the signed url on success', async () => {
    mockState.signed = { data: { signedUrl: 'https://x/y?token=abc' }, error: null };
    expect(await signatureUrl('p/g.png')).toBe('https://x/y?token=abc');
  });

  it('returns null when data has no signedUrl', async () => {
    mockState.signed = { data: {}, error: null };
    expect(await signatureUrl('p/g.png')).toBeNull();
  });
});
