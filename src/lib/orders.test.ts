import { describe, it, expect, vi, beforeEach } from 'vitest';

// מצב נשלט של ה-mock — משתנה בין בדיקות
const mockState: {
  configured: boolean;
  result: { data: unknown; error: unknown };
  eqCalls: unknown[][];
  fromCalls: number;
} = { configured: true, result: { data: [], error: null }, eqCalls: [], fromCalls: 0 };

vi.mock('./supabase', () => {
  function makeQuery() {
    const q = {
      eq: (...args: unknown[]) => {
        mockState.eqCalls.push(args);
        return q;
      },
      // הופך את האובייקט ל-thenable כדי ש-await יקבל את התוצאה
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
        return { select: () => ({ order: () => makeQuery() }) };
      }
    }
  };
});

import { fetchOrders } from './orders';

beforeEach(() => {
  mockState.configured = true;
  mockState.result = { data: [], error: null };
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
    mockState.result = { data: [], error: null };
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
