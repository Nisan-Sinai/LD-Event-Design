import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { storage } from './storage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('storage', () => {
  it('round-trips an object value', () => {
    storage.set('k', { a: 1, b: 'x' });
    expect(storage.get<{ a: number; b: string }>('k')).toEqual({ a: 1, b: 'x' });
  });

  it('returns null for a missing key', () => {
    expect(storage.get('missing')).toBeNull();
  });

  it('returns null for invalid JSON instead of throwing', () => {
    localStorage.setItem('bad', '{not valid json');
    expect(storage.get('bad')).toBeNull();
  });

  it('removes a key', () => {
    storage.set('k', 1);
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => storage.set('k', 1)).not.toThrow();
    expect(() => storage.remove('k')).not.toThrow();
    expect(storage.get('k')).toBeNull();
  });
});
